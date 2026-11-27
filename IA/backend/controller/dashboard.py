"""Rotas de dados agregados usados nos gráficos do dashboard."""
from fastapi import APIRouter

from ..analise import por_data, por_status

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/status")
def consultar_status():
    return por_status()


@router.get("/solicitacoes-por-dia")
def consultar_solicitacoes_por_dia():
    return por_data()
