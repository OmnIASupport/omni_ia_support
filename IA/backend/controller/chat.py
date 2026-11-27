"""Consultas em linguagem natural sobre o CSV do Omni IA Support.

Fluxo (mesmo do Radar Urbano):
1. O Python/Pandas interpreta a pergunta e calcula o resultado diretamente no CSV.
2. O Ollama Local recebe SOMENTE o resultado calculado e produz uma explicação.
3. Se o Ollama estiver desligado, o resultado do Python continua sendo devolvido.
"""
from __future__ import annotations

import json
import unicodedata

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .. import modelo_ia, ollama_local
from ..analise import agrupar, ler_dados, por_data, por_erro, por_status, resumo

router = APIRouter(prefix="/chat", tags=["Omni IA - Chat"])

PROMPT_SISTEMA = """
Você é o Omni IA, assistente do sistema Omni IA Support, uma simulação de acessibilidade
e comunicação entre pessoas surdas e ouvintes (texto, áudio, vídeo e Libras).
Seu trabalho é explicar resultados produzidos pelo Python/Pandas.

REGRAS:
1. Responda em português brasileiro, de forma objetiva e simples.
2. Utilize exclusivamente os dados fornecidos no JSON.
3. Nunca invente informações, números, categorias ou funcionalidades.
4. Não faça novos cálculos nem altere os valores recebidos.
5. Tempos estão em milissegundos (ms); confiança vai de 0 a 1.
6. Lembre que os dados são simulados quando for pertinente.
7. Seja breve: no máximo um parágrafo curto.
""".strip()

PERGUNTAS_SUGERIDAS = [
    "Quantas solicitações de tradução foram registradas?",
    "Qual direção de tradução tem mais erros?",
    "Quais são os erros mais frequentes?",
    "Qual é o tempo médio de processamento?",
    "Qual tipo de processamento é mais rápido?",
    "Qual modalidade de entrada é mais usada?",
    "Qual direção tem maior confiança média?",
    "Qual dia teve mais solicitações?",
    "Quantos usuários usam Libras?",
    "Qual é a acurácia do modelo de IA?",
]

ROTULOS = {
    "direcao_traducao": "direção de tradução",
    "tipo_processamento": "tipo de processamento",
    "tipo_entrada": "modalidade de entrada",
    "tipo_usuario": "tipo de usuário",
    "status_sessao_comunicacao": "status da sessão",
}

DIMENSOES = [
    ("direcao_traducao", ("direcao", "direcoes", "sentido da traducao", "par de traducao")),
    ("tipo_processamento", ("tipo de processamento", "tipos de processamento", "modo de processamento",
                            "automatico", "manual", "hibrido")),
    ("tipo_entrada", ("entrada", "modalidade", "modalidades")),
    ("tipo_usuario", ("tipo de usuario", "tipos de usuario", "perfil", "perfis", "aluno", "professor",
                      "administrador", "convidado")),
    ("status_sessao_comunicacao", ("sessao", "sessoes")),
]

# metrica -> (palavras-chave, coluna de ordenação, ordem decrescente?)
METRICAS = [
    ("erro", ("erro", "falha", "falham", "falhou", "problema"), "percentual_erro", True),
    ("conclusao", ("conclu", "sucesso", "bem-sucedid"), "percentual_concluidas", True),
    ("tempo", ("tempo", "demora", "demorad", "rapid", "lent", "duracao", " ms"), "tempo_medio_ms", None),
    ("confianca", ("confianca", "precisao", "confiavel"), "confianca_media", True),
]


class Consulta(BaseModel):
    pergunta: str = Field(min_length=3, max_length=500)


def normalizar(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto.casefold())
    return " " + "".join(c for c in texto if not unicodedata.combining(c)) + " "


def _tem(q: str, termos) -> bool:
    return any(t in q for t in termos)


def _dimensao(q: str) -> str | None:
    for coluna, termos in DIMENSOES:
        if _tem(q, termos):
            return coluna
    return None


def _metrica(q: str):
    for nome, termos, coluna, desc in METRICAS:
        if _tem(q, termos):
            return nome, coluna, desc
    return None


def _ranking_por(coluna: str, metrica, q: str = "") -> dict:
    tabela = agrupar(coluna)
    titulo = f"Solicitações por {ROTULOS[coluna]}"
    # Categoria citada na pergunta (ex.: "sessões ativas", "aluno", "manual")
    citadas = [item for item in tabela if normalizar(str(item[coluna])).strip() in q]
    if metrica is None:
        saida = {"titulo": titulo}
        if citadas:
            saida["categoria_consultada"] = citadas[0]
        saida.update(mais_frequente=tabela[0], ranking=tabela)
        return saida

    nome, campo, desc = metrica
    if desc is None:  # tempo: "rápido" pede o menor; "lento/demorado" pede o maior
        desc = True
    ordenada = sorted(tabela, key=lambda x: x[campo], reverse=desc)
    return {
        "titulo": f"{titulo} — ordenado por {campo.replace('_', ' ')}",
        "maior_valor": ordenada[0],
        "menor_valor": ordenada[-1],
        "ranking": ordenada,
    }


def calcular(pergunta: str) -> dict:
    df = ler_dados()
    q = normalizar(pergunta)

    # 1) Modelo de IA (Árvore de Decisão)
    if _tem(q, ("modelo", "arvore", "acuracia", "previs", "prever", "machine learning", "aprendizado")):
        info = modelo_ia.info()
        return {
            "titulo": "Modelo de IA — Árvore de Decisão",
            "objetivo": "Estimar o status da solicitação de tradução",
            "acuracia_teste_percentual": info["acuracia_teste_percentual"],
            "acuracia_referencia_percentual": info["acuracia_referencia_percentual"],
            "registros_treino": info["registros_treino"],
            "classes": info["classes"],
            "variaveis_entrada": info["variaveis_entrada"],
        }

    dimensao = _dimensao(q)
    metrica = _metrica(q)

    # 2) Cruzamento "dimensão x métrica" ou ranking simples de uma dimensão
    if dimensao:
        return _ranking_por(dimensao, metrica, q)

    # 3) Pergunta por data/dia
    if _tem(q, (" dia ", " dias ", " data", "diari", "periodo", "semana")):
        dados = por_data(df)
        pico = max(dados, key=lambda x: x["total_solicitacoes"])
        menor = min(dados, key=lambda x: x["total_solicitacoes"])
        r = resumo(df)
        return {
            "titulo": "Solicitações por dia",
            "periodo": f"{r['data_inicial']} a {r['data_final']}",
            "dias_com_registro": len(dados),
            "dia_com_mais_solicitacoes": pico,
            "dia_com_menos_solicitacoes": menor,
        }

    # 4) Libras
    if "libras" in q:
        usa = df[df["usa_libras"] == "sim"]
        return {
            "titulo": "Uso de Libras",
            "solicitacoes_de_quem_usa_libras": int(len(usa)),
            "percentual_das_solicitacoes": round(len(usa) / len(df) * 100, 2),
            "usuarios_distintos_que_usam_libras": int(usa["id_usuario"].nunique()),
            "solicitacoes_envolvendo_libras_por_direcao": [
                d for d in agrupar("direcao_traducao") if "libras" in d["direcao_traducao"].lower()
            ],
        }

    # 5) Métricas gerais sem dimensão
    if metrica:
        nome = metrica[0]
        r = resumo(df)
        if nome == "erro":
            return {
                "titulo": "Erros nas solicitações de tradução",
                "total_com_erro": int(df["com_erro"].sum()),
                "taxa_erro_percentual": r["taxa_erro_percentual"],
                "erros_por_tipo": por_erro(df),
            }
        if nome == "conclusao":
            return {
                "titulo": "Solicitações concluídas",
                "total_concluidas": int(df["concluida"].sum()),
                "taxa_conclusao_percentual": r["taxa_conclusao_percentual"],
                "distribuicao_por_status": por_status(df),
            }
        if nome == "tempo":
            return {
                "titulo": "Tempo de processamento",
                "tempo_medio_ms": r["tempo_medio_processamento_ms"],
                "tempo_mediano_ms": r["tempo_mediano_processamento_ms"],
                "tempo_medio_por_tipo_de_processamento": [
                    {"tipo_processamento": x["tipo_processamento"], "tempo_medio_ms": x["tempo_medio_ms"]}
                    for x in sorted(agrupar("tipo_processamento", df), key=lambda x: x["tempo_medio_ms"])
                ],
            }
        if nome == "confianca":
            return {
                "titulo": "Confiança média das etapas",
                "confianca_media_geral": r["confianca_media_etapas"],
                "confianca_por_direcao": [
                    {"direcao_traducao": x["direcao_traducao"], "confianca_media": x["confianca_media"]}
                    for x in sorted(agrupar("direcao_traducao", df), key=lambda x: -x["confianca_media"])
                ],
            }

    # 6) Status (cancelada, processando, pendente...)
    if _tem(q, ("status", "cancel", "processando", "andamento", "pendente", "aberta", "situacao")):
        dados = por_status(df)
        if _tem(q, ("cancel",)):
            dados = [d for d in dados if d["status"] == "cancelada"]
            titulo = "Solicitações canceladas"
        elif _tem(q, ("processando", "andamento", "pendente", "aberta")):
            dados = [d for d in dados if d["status"] == "processando"]
            titulo = "Solicitações ainda em processamento"
        else:
            titulo = "Solicitações por status"
        return {"titulo": titulo, "total_geral": int(len(df)), "detalhamento": dados}

    # 7) Usuários
    if _tem(q, ("usuario", "usuarios", "pessoa", "pessoas")):
        return {
            "titulo": "Usuários",
            "usuarios_distintos": int(df["id_usuario"].nunique()),
            "por_status_do_usuario": [
                {"status_usuario": str(k), "solicitacoes": int(v)}
                for k, v in df["status_usuario"].value_counts().items()
            ],
        }

    # 8) Mídias
    if _tem(q, ("midia", "midias", "arquivo", "arquivos")):
        return {
            "titulo": "Mídias de entrada",
            "total_unidades_de_midia": int(df["qtd_midias_entrada"].sum()),
            "media_por_solicitacao": round(float(df["qtd_midias_entrada"].mean()), 2),
        }

    # 9) Panorama geral
    r = resumo(df)
    return {
        "titulo": "Panorama geral das solicitações de tradução",
        "total_solicitacoes": r["total_solicitacoes"],
        "total_sessoes": r["total_sessoes"],
        "usuarios_distintos": r["total_usuarios_identificados"],
        "tempo_medio_ms": r["tempo_medio_processamento_ms"],
        "confianca_media": r["confianca_media_etapas"],
        "taxa_conclusao_percentual": r["taxa_conclusao_percentual"],
        "periodo": f"{r['data_inicial']} a {r['data_final']}",
        "distribuicao_por_status": por_status(df),
    }


def explicar_localmente(resultado: dict, pergunta: str) -> str:
    conteudo = (
        f"PERGUNTA ORIGINAL:\n{pergunta}\n\n"
        f"DADOS CALCULADOS PELO PYTHON:\n{json.dumps(resultado, ensure_ascii=False)}\n\n"
        "Explique brevemente os dados apresentados sem inventar informações."
    )
    return ollama_local.conversar(PROMPT_SISTEMA, conteudo)


@router.get("/perguntas")
def perguntas_sugeridas():
    return {
        "perguntas": PERGUNTAS_SUGERIDAS,
        "modelo": ollama_local.OLLAMA_MODEL,
        "provedor": "Ollama Local (sem nuvem)",
    }


@router.get("/status-ollama")
def status_ollama():
    return ollama_local.status()


@router.post("")
def consultar_chat(consulta: Consulta):
    pergunta = consulta.pergunta.strip()
    if len(pergunta) < 3:
        raise HTTPException(status_code=422, detail="Digite uma pergunta com pelo menos 3 caracteres.")

    try:
        resultado = calcular(pergunta)
    except (FileNotFoundError, ValueError) as erro:
        raise HTTPException(status_code=503, detail=str(erro))

    try:
        explicacao = explicar_localmente(resultado, pergunta)
        aviso = None if explicacao else "O Ollama não retornou uma explicação. O resultado do Python está disponível."
    except Exception as erro:
        explicacao = (
            "O cálculo foi realizado pelo Python usando o CSV. Para receber uma explicação "
            f"automática, inicie o Ollama Local e instale o modelo '{ollama_local.OLLAMA_MODEL}'."
        )
        aviso = f"Ollama indisponível ({type(erro).__name__}: {erro}). O cálculo do Python foi preservado."

    return {
        "pergunta": pergunta,
        "resultado": resultado,
        "explicacao": explicacao,
        "aviso": aviso,
        "provedor": "Ollama Local (opcional)",
        "modelo": ollama_local.OLLAMA_MODEL,
    }
