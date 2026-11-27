"""Rotas de resumo e detalhamento do Omni IA Support."""
from fastapi import APIRouter

from ..analise import agrupar, por_erro, qualidade, resumo

router = APIRouter(prefix="/analise", tags=["Análises"])


@router.get("/resumo")
def consultar_resumo():
    return {**resumo(), **qualidade()}


@router.get("/direcoes")
def consultar_direcoes():
    return agrupar("direcao_traducao")


@router.get("/tipos")
def consultar_tipos_processamento():
    return agrupar("tipo_processamento")


@router.get("/modalidades")
def consultar_modalidades():
    return agrupar("tipo_entrada")


@router.get("/usuarios")
def consultar_tipos_usuario():
    return agrupar("tipo_usuario")


@router.get("/sessoes")
def consultar_status_sessao():
    return agrupar("status_sessao_comunicacao")


@router.get("/erros")
def consultar_erros():
    return por_erro()
