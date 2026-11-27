"""Rotas da Árvore de Decisão (previsão experimental do status da solicitação)."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .. import modelo_ia

router = APIRouter(prefix="/modelo", tags=["Modelo de IA"])


class EntradaModelo(BaseModel):
    usa_libras: str
    tipo_entrada: str
    direcao_traducao: str
    tipo_processamento: str
    formato_origem_tipo: str
    formato_destino_tipo: str
    status_usuario: str
    status_sessao_comunicacao: str

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "usa_libras": "sim",
                "tipo_entrada": "libras",
                "direcao_traducao": "Libras>PT-BR",
                "tipo_processamento": "automatico",
                "formato_origem_tipo": "sinais",
                "formato_destino_tipo": "texto",
                "status_usuario": "ativo",
                "status_sessao_comunicacao": "ativa",
            }]
        }
    }


@router.get("/info")
def informacoes_modelo():
    return modelo_ia.info()


@router.post("/prever")
def prever_status(entrada: EntradaModelo):
    try:
        return modelo_ia.prever(entrada.model_dump())
    except ValueError as erro:
        raise HTTPException(status_code=422, detail=str(erro))


@router.post("/treinar")
def treinar_novamente():
    pacote = modelo_ia.treinar()
    return {
        "mensagem": "Modelo treinado novamente.",
        "acuracia_teste_percentual": pacote["acuracia_teste_percentual"],
    }
