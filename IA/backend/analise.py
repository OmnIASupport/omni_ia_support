"""Leitura, validação e consultas descritivas do Omni IA Support.

Cada linha do CSV representa uma solicitação de tradução (1 linha = 1 solicitação).
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

CAMINHO_CSV = Path(__file__).resolve().parent.parent / "database" / "omni_dataset_10000_corrigido.csv"

STATUS_VALIDOS = {"concluida", "erro", "cancelada", "processando"}

COLUNAS_OBRIGATORIAS = [
    "id_solicitacao_traducao", "id_mensagem", "id_sessao", "tipo_sessao",
    "status_sessao_comunicacao", "id_usuario", "tipo_usuario", "status_usuario",
    "papel_participante", "usa_libras", "tipo_entrada", "status_mensagem",
    "direcao_traducao", "tipo_processamento", "formato_origem_tipo",
    "formato_destino_tipo", "solicitada_em", "iniciada_em", "finalizada_em",
    "tempo_processamento_ms", "status_solicitacao_traducao", "codigo_erro",
    "mensagem_erro", "qtd_midias_entrada", "qtd_etapas", "confianca_media_etapas",
]

# Colunas que podem ficar vazias por regra de negócio:
# - finalizada_em: vazia enquanto a solicitação está "processando";
# - codigo_erro / mensagem_erro: preenchidas apenas quando o status é "erro";
# - confianca_media_movimentos: vazia quando não houve movimentos (qtd_movimentos = 0).
COLUNAS_OPCIONAIS = {"finalizada_em", "codigo_erro", "mensagem_erro", "confianca_media_movimentos"}

_cache: dict = {"mtime": None, "df": None, "bruto": None}


def _ler_csv() -> pd.DataFrame:
    if not CAMINHO_CSV.exists():
        raise FileNotFoundError(f"CSV não encontrado: {CAMINHO_CSV}")
    try:
        return pd.read_csv(CAMINHO_CSV, encoding="utf-8")
    except UnicodeDecodeError:
        return pd.read_csv(CAMINHO_CSV, encoding="latin-1")


def _validar(bruto: pd.DataFrame) -> pd.DataFrame:
    faltantes = sorted(set(COLUNAS_OBRIGATORIAS) - set(bruto.columns))
    if faltantes:
        raise ValueError("Colunas ausentes no CSV: " + ", ".join(faltantes))
    if bruto.empty:
        raise ValueError("O CSV de solicitações está vazio.")

    df = bruto.copy()

    obrigatorias = [c for c in COLUNAS_OBRIGATORIAS if c not in COLUNAS_OPCIONAIS]
    vazias = [c for c in obrigatorias if df[c].isna().any()]
    if vazias:
        raise ValueError("Existem valores vazios nas colunas: " + ", ".join(vazias))

    for coluna in ["solicitada_em", "iniciada_em", "finalizada_em"]:
        df[coluna] = pd.to_datetime(df[coluna], format="%Y-%m-%d %H:%M:%S", errors="coerce")
    if df["solicitada_em"].isna().any() or df["iniciada_em"].isna().any():
        raise ValueError("Há datas obrigatórias inválidas.")

    numericos = [
        "id_solicitacao_traducao", "id_sessao", "id_usuario", "tempo_processamento_ms",
        "qtd_midias_entrada", "qtd_etapas", "confianca_media_etapas",
    ]
    for coluna in numericos:
        df[coluna] = pd.to_numeric(df[coluna], errors="raise")

    if df["id_solicitacao_traducao"].duplicated().any():
        raise ValueError("Há solicitações com identificador repetido.")
    if not df["status_solicitacao_traducao"].isin(STATUS_VALIDOS).all():
        raise ValueError("Há status de solicitação desconhecido.")
    if not df["confianca_media_etapas"].between(0, 1).all():
        raise ValueError("A confiança deve estar entre 0 e 1.")
    if (df["tempo_processamento_ms"] < 0).any():
        raise ValueError("O tempo de processamento não pode ser negativo.")

    processando = df["status_solicitacao_traducao"].eq("processando")
    if df.loc[processando, "finalizada_em"].notna().any():
        raise ValueError("Solicitações em processamento não devem ter data de finalização.")
    if df.loc[~processando, "finalizada_em"].isna().any():
        raise ValueError("Há solicitações finalizadas sem data de finalização.")

    df["concluida"] = df["status_solicitacao_traducao"].eq("concluida").astype(int)
    df["com_erro"] = df["status_solicitacao_traducao"].eq("erro").astype(int)
    df["data"] = df["solicitada_em"].dt.strftime("%Y-%m-%d")
    return df


def ler_dados() -> pd.DataFrame:
    """Carrega e valida o CSV. Recarrega automaticamente se o arquivo for alterado."""
    if not CAMINHO_CSV.exists():
        raise FileNotFoundError(f"CSV não encontrado: {CAMINHO_CSV}")
    mtime = CAMINHO_CSV.stat().st_mtime
    if _cache["mtime"] != mtime:
        bruto = _ler_csv()
        _cache.update(df=_validar(bruto), bruto=bruto, mtime=mtime)
    return _cache["df"]


def ler_bruto() -> pd.DataFrame:
    """CSV original (todas as colunas), usado nos indicadores de qualidade."""
    ler_dados()
    return _cache["bruto"]


# ---------------------------------------------------------------------------
# Indicadores
# ---------------------------------------------------------------------------
def resumo(df: pd.DataFrame | None = None) -> dict:
    df = ler_dados() if df is None else df
    total = len(df)
    por_status = {
        str(status): {"solicitacoes": int(qtd), "percentual": round(qtd / total * 100, 2)}
        for status, qtd in df["status_solicitacao_traducao"].value_counts().items()
    }
    return {
        "total_registros": int(total),
        "total_solicitacoes": int(df["id_solicitacao_traducao"].nunique()),
        "total_sessoes": int(df["id_sessao"].nunique()),
        "total_usuarios_identificados": int(df["id_usuario"].nunique()),
        "tempo_medio_processamento_ms": round(float(df["tempo_processamento_ms"].mean()), 2),
        "tempo_mediano_processamento_ms": round(float(df["tempo_processamento_ms"].median()), 2),
        "confianca_media_etapas": round(float(df["confianca_media_etapas"].mean()), 4),
        "total_unidades_de_midia": int(df["qtd_midias_entrada"].sum()),
        "taxa_conclusao_percentual": round(float(df["concluida"].mean() * 100), 2),
        "taxa_erro_percentual": round(float(df["com_erro"].mean() * 100), 2),
        "por_status": por_status,
        "data_inicial": df["solicitada_em"].min().strftime("%Y-%m-%d"),
        "data_final": df["solicitada_em"].max().strftime("%Y-%m-%d"),
    }


def qualidade() -> dict:
    bruto = ler_bruto()
    essenciais = [c for c in bruto.columns if c not in COLUNAS_OPCIONAIS]
    return {
        "total_colunas": int(bruto.shape[1]),
        "total_valores_vazios": int(bruto.isna().sum().sum()),
        "registros_com_campos_essenciais_vazios": int(bruto[essenciais].isna().any(axis=1).sum()),
        "linhas_duplicadas": int(bruto.duplicated().sum()),
        "colunas_opcionais": sorted(COLUNAS_OPCIONAIS),
    }


def agrupar(coluna: str, df: pd.DataFrame | None = None) -> list[dict]:
    """Agregação padrão: volume, tempo médio, confiança e taxas de conclusão/erro."""
    df = ler_dados() if df is None else df
    tabela = df.groupby(coluna, as_index=False).agg(
        registros=("id_solicitacao_traducao", "count"),
        tempo_medio_ms=("tempo_processamento_ms", "mean"),
        confianca_media=("confianca_media_etapas", "mean"),
        concluidas=("concluida", "sum"),
        com_erro=("com_erro", "sum"),
    )
    tabela["percentual_concluidas"] = (tabela["concluidas"] / tabela["registros"] * 100).round(2)
    tabela["percentual_erro"] = (tabela["com_erro"] / tabela["registros"] * 100).round(2)
    tabela["tempo_medio_ms"] = tabela["tempo_medio_ms"].round(2)
    tabela["confianca_media"] = tabela["confianca_media"].round(4)
    tabela = tabela.sort_values(["registros", coluna], ascending=[False, True])
    return [
        {k: (v.item() if hasattr(v, "item") else v) for k, v in linha.items()}
        for linha in tabela.to_dict(orient="records")
    ]


def por_status(df: pd.DataFrame | None = None) -> list[dict]:
    df = ler_dados() if df is None else df
    total = len(df)
    contagem = df["status_solicitacao_traducao"].value_counts()
    return [
        {"status": str(k), "quantidade": int(v), "percentual": round(v / total * 100, 2)}
        for k, v in contagem.items()
    ]


def por_erro(df: pd.DataFrame | None = None) -> list[dict]:
    df = ler_dados() if df is None else df
    erros = df[df["com_erro"] == 1]
    tabela = erros.groupby(["codigo_erro", "mensagem_erro"]).size().sort_values(ascending=False)
    return [
        {"codigo_erro": str(c), "mensagem_erro": str(m), "quantidade": int(q)}
        for (c, m), q in tabela.items()
    ]


def por_data(df: pd.DataFrame | None = None) -> list[dict]:
    df = ler_dados() if df is None else df
    tabela = df.groupby("data", as_index=False).agg(
        total_solicitacoes=("id_solicitacao_traducao", "count"),
        tempo_medio_ms=("tempo_processamento_ms", "mean"),
        concluidas=("concluida", "sum"),
    )
    tabela["tempo_medio_ms"] = tabela["tempo_medio_ms"].round(2)
    return [
        {"data": r["data"], "total_solicitacoes": int(r["total_solicitacoes"]),
         "tempo_medio_ms": float(r["tempo_medio_ms"]), "concluidas": int(r["concluidas"])}
        for r in tabela.to_dict(orient="records")
    ]
