"""Confere se o interpretador de perguntas escolhe o cálculo certo e se os números batem."""
from backend.analise import ler_dados
from backend.controller.chat import PERGUNTAS_SUGERIDAS, calcular

df = ler_dados()


def test_todas_as_sugestoes_respondem():
    for pergunta in PERGUNTAS_SUGERIDAS:
        resultado = calcular(pergunta)
        assert resultado.get("titulo"), pergunta


def test_direcao_com_mais_erros():
    r = calcular("Qual direção de tradução tem mais erros?")
    esperado = (df.groupby("direcao_traducao")["com_erro"].mean()).idxmax()
    assert r["maior_valor"]["direcao_traducao"] == esperado


def test_processamento_mais_rapido():
    r = calcular("Qual tipo de processamento é mais rápido?")
    esperado = df.groupby("tipo_processamento")["tempo_processamento_ms"].mean().idxmin()
    assert r["menor_valor"]["tipo_processamento"] == esperado


def test_modalidade_mais_usada():
    r = calcular("Qual modalidade de entrada é mais usada?")
    assert r["mais_frequente"]["tipo_entrada"] == df["tipo_entrada"].value_counts().idxmax()


def test_dia_com_mais_solicitacoes():
    r = calcular("Qual dia teve mais solicitações?")
    assert r["dia_com_mais_solicitacoes"]["data"] == df["data"].value_counts().idxmax()


def test_libras():
    r = calcular("Quantos usuários usam Libras?")
    assert r["solicitacoes_de_quem_usa_libras"] == int((df["usa_libras"] == "sim").sum())


def test_canceladas():
    r = calcular("Quantas estão canceladas?")
    assert r["detalhamento"][0]["quantidade"] == int((df["status_solicitacao_traducao"] == "cancelada").sum())


def test_categoria_citada():
    r = calcular("Quantas sessões estão ativas?")
    assert r["categoria_consultada"]["status_sessao_comunicacao"] == "ativa"


def test_pergunta_generica_cai_no_panorama():
    assert calcular("oi, tudo bem?")["titulo"].startswith("Panorama")
