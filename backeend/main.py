import logging


from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from httpx import RequestError
from postgrest.exceptions import APIError


# ALTERADO: acrescentado o controller de autenticação.
from controller import (
    usuario,
    formato_idioma,
    autenticacao,
)

# NOVO: disponibiliza o CRUD de perfis de acessibilidade.
from controller.perfil_acessibilidade import (
    router as perfil_acessibilidade_router,
)



logger = logging.getLogger("uvicorn.error")



app = FastAPI(
    title="Omni IA Support - API",
    description=(
        "Cadastro, consulta de usuários, "
        "verificação de login, formatos/idiomas "
        "e preferências de acessibilidade "
        "com Supabase por HTTPS."
    ),
)



# Configuração do CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_methods=[
        "GET",
        "POST",
        "PATCH",
        "DELETE",
    ],
   allow_headers=[
    "Content-Type",
    "Authorization",
],
)



# Registro das rotas.
app.include_router(usuario.router)
app.include_router(formato_idioma.router)


# NOVO: disponibiliza POST /login/.
app.include_router(autenticacao.router)


# NOVO: disponibiliza o CRUD de perfis de acessibilidade.
app.include_router(perfil_acessibilidade_router)



# Trata erros retornados pela Data API do Supabase.
@app.exception_handler(APIError)
async def tratar_erro_supabase(
    request: Request,
    erro: APIError,
):
    # Não registra o conteúdo completo da exceção,
    # que pode conter detalhes da operação.
    logger.error(
        "Erro na operação do Supabase. Código: %s",
        erro.code,
    )

    # Código 23503: violação de chave estrangeira.
    if erro.code == "23503":
        return JSONResponse(
            status_code=409,
            content={
                "detail": (
                    "Operação bloqueada por um vínculo entre tabelas. "
                    "Confira o usuário vinculado ao perfil de "
                    "acessibilidade. Um perfil só pode ser criado "
                    "para um usuário cadastrado."
                )
            },
        )

    return JSONResponse(
        status_code=502,
        content={
            "detail": (
                "O Supabase recusou a operação. "
                "Verifique a configuração do backend."
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