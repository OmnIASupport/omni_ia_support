"""Aplicação FastAPI do Omni IA Support. Execute na raiz com backend.main:app."""
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import models  # noqa: F401  (registra as tabelas antes do create_all)
from .controller.chat import router as chat_router
from .controller.dashboard import router as dashboard_router
from .controller.formato_idioma import router as formato_idioma_router
from .controller.modelo import router as modelo_router
from .controller.resumo import router as resumo_router
from .controller.usuario import router as usuario_router
from .database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Omni IA Support - API de Dados e IA",
    description=(
        "Indicadores do dataset simulado de solicitações de tradução (texto, áudio, vídeo e Libras), "
        "Árvore de Decisão experimental e chat com Ollama Local."
    ),
    version="2.0.0",
)

PORTA_SITE = os.getenv("OMNI_PORTA_SITE", "5501")
origens = {
    f"http://{host}:{porta}"
    for host in ("127.0.0.1", "localhost")
    for porta in {PORTA_SITE, "5500", "5501", "5502"}
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(origens),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(resumo_router)
app.include_router(dashboard_router)
app.include_router(chat_router)
app.include_router(modelo_router)
app.include_router(usuario_router)
app.include_router(formato_idioma_router)


@app.get("/", tags=["Saúde"])
def home():
    return {"status": "ok", "mensagem": "API Omni IA Support funcionando.", "documentacao": "/docs"}


@app.get("/health", tags=["Saúde"])
def health():
    return {"status": "healthy"}


@app.exception_handler(FileNotFoundError)
async def arquivo_nao_encontrado(request: Request, erro: FileNotFoundError):
    return JSONResponse(status_code=503, content={"detail": "Arquivo CSV não encontrado na pasta database."})


@app.exception_handler(ValueError)
async def dados_invalidos(request: Request, erro: ValueError):
    return JSONResponse(status_code=503, content={"detail": f"Não foi possível analisar o CSV: {erro}"})
