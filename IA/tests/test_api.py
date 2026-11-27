import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_resumo_tem_indicadores():
    r = client.get("/analise/resumo")
    assert r.status_code == 200
    d = r.json()
    assert d["total_registros"] == 10000
    assert d["total_solicitacoes"] == 10000
    assert d["total_usuarios_identificados"] == 4347
    assert d["data_inicial"] == "2026-09-01"
    assert d["data_final"] == "2026-09-22"
    assert 0 <= d["confianca_media_etapas"] <= 1
    assert d["registros_com_campos_essenciais_vazios"] == 0
    assert d["linhas_duplicadas"] == 0
    assert d["total_colunas"] == 58


@pytest.mark.parametrize("rota,campo", [
    ("/analise/direcoes", "direcao_traducao"),
    ("/analise/tipos", "tipo_processamento"),
    ("/analise/modalidades", "tipo_entrada"),
    ("/analise/usuarios", "tipo_usuario"),
    ("/analise/sessoes", "status_sessao_comunicacao"),
])
def test_agrupamentos_fecham_com_total(rota, campo):
    total = client.get("/analise/resumo").json()["total_registros"]
    dados = client.get(rota).json()
    assert dados and campo in dados[0]
    assert sum(x["registros"] for x in dados) == total


def test_rotas_dashboard():
    status = client.get("/dashboard/status").json()
    assert {x["status"] for x in status} == {"concluida", "cancelada", "erro", "processando"}
    assert round(sum(x["percentual"] for x in status)) == 100
    dias = client.get("/dashboard/solicitacoes-por-dia").json()
    assert sum(x["total_solicitacoes"] for x in dias) == 10000


def test_erros_batem_com_status():
    erros = sum(x["quantidade"] for x in client.get("/analise/erros").json())
    status = {x["status"]: x["quantidade"] for x in client.get("/dashboard/status").json()}
    assert erros == status["erro"]


def test_cors_frontend_local():
    r = client.options(
        "/analise/resumo",
        headers={"Origin": "http://127.0.0.1:5501", "Access-Control-Request-Method": "GET"},
    )
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") == "http://127.0.0.1:5501"


def test_modelo_info_e_previsao():
    info = client.get("/modelo/info").json()
    assert info["classes"] == ["cancelada", "concluida", "erro", "processando"]
    entrada = {c: info["valores_validos"][c][0] for c in info["variaveis_entrada"]}
    r = client.post("/modelo/prever", json=entrada)
    assert r.status_code == 200
    d = r.json()
    assert d["previsao"] in info["classes"]
    assert abs(sum(p["probabilidade"] for p in d["probabilidades"]) - 1) < 0.01


def test_modelo_rejeita_valor_invalido():
    info = client.get("/modelo/info").json()
    entrada = {c: info["valores_validos"][c][0] for c in info["variaveis_entrada"]}
    entrada["tipo_entrada"] = "telepatia"
    assert client.post("/modelo/prever", json=entrada).status_code == 422


def test_chat_preserva_resultado_python_sem_ollama(monkeypatch):
    from backend.controller import chat
    monkeypatch.setattr(chat, "explicar_localmente", lambda *_: (_ for _ in ()).throw(RuntimeError("offline test")))
    r = client.post("/chat", json={"pergunta": "Qual direção de tradução tem mais erros?"})
    assert r.status_code == 200
    d = r.json()
    assert d["resultado"]["ranking"]
    assert "offline test" in d["aviso"]


def test_chat_rejeita_json_invalido():
    assert client.post("/chat", json={"mensagem": "oi"}).status_code == 422


def test_cadastro_usuario_sqlite():
    r = client.post("/usuarios/", json={"nome_exibicao": "Teste automatizado"})
    assert r.status_code == 201
    assert any(u["nome_exibicao"] == "Teste automatizado" for u in client.get("/usuarios/").json())
