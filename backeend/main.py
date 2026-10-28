import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from httpx import RequestError
from postgrest.exceptions import APIError

from controller import usuario, formato_idioma


logger = logging.getLogger("uvicorn.error")

app = FastAPI(
    title="Omni IA Support - API",
    description=(
        "CRUD de usuários e formatos/idiomas "
        "com Supabase por HTTPS."
    ),
)


# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)


# Registra todas as rotas dos dois arquivos.
app.include_router(usuario.router)
app.include_router(formato_idioma.router)


# Trata erros retornados pela Data API do Supabase.
@app.exception_handler(APIError)
async def tratar_erro_supabase(
    request: Request,
    erro: APIError,
):
    logger.error(
        "Erro na operação do Supabase: %s",
        erro,
    )

    return JSONResponse(
        status_code=502,
        content={
            "detail": (
                "O Supabase recusou a operação. "
                "Confira a mensagem no terminal."
            )
        },
    )


# Trata falhas durante a comunicação HTTP.
@app.exception_handler(RequestError)
async def tratar_erro_rede(
    request: Request,
    erro: RequestError,
):
    logger.error(
        "Falha de comunicação: %s",
        type(erro).__name__,
    )

    return JSONResponse(
        status_code=503,
        content={
            "detail": (
                "Não foi possível acessar o Supabase. "
                "Verifique a conexão e a disponibilidade do serviço."
            )
        },
    )