# Omni IA Support — Autenticação
#
# POST /login/
# - Verifica e-mail e senha.
# - Retorna dados públicos e token de acesso.
#
# GET /login/me
# - Valida o token.
# - Retorna o usuário autenticado.

import logging

from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)
from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError

from database import supabase
from models import (
    LoginEntrada,
    LoginSaida,
    UsuarioAutenticadoSaida,
)
from seguranca import (
    DURACAO_TOKEN_MINUTOS,
    criar_token_acesso,
    obter_usuario_atual,
)


logger = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/login",
    tags=["Autenticação"],
)

password_hash = PasswordHash.recommended()

HASH_FICTICIO = password_hash.hash(
    "valor-interno-para-verificacao-de-login"
)


@router.post(
    "/",
    response_model=LoginSaida,
    status_code=status.HTTP_200_OK,
)
def entrar(
    dados: LoginEntrada,
    response: Response,
):
    response.headers["Cache-Control"] = "no-store"

    resultado = (
        supabase.table("usuario")
        .select(
            "id_usuario,"
            "nome_exibicao,"
            "email_usuario,"
            "tipo_usuario,"
            "status_usuario,"
            "senha_usuario"
        )
        .eq("email_usuario", dados.email_usuario)
        .limit(1)
        .execute()
    )

    usuario = resultado.data[0] if resultado.data else None

    hash_salvo = (
        usuario.get("senha_usuario")
        if usuario
        else None
    )

    hash_disponivel = (
        isinstance(hash_salvo, str)
        and bool(hash_salvo)
    )

    hash_para_verificar = (
        hash_salvo
        if hash_disponivel
        else HASH_FICTICIO
    )

    senha_original = dados.senha_usuario.get_secret_value()

    try:
        senha_valida = password_hash.verify(
            senha_original,
            hash_para_verificar,
        )
    except UnknownHashError:
        logger.error(
            "Login recusado: hash de senha não reconhecido."
        )
        senha_valida = False

    if (
        usuario is None
        or not hash_disponivel
        or not senha_valida
        or usuario.get("status_usuario") != "ativo"
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
            headers={
                "Cache-Control": "no-store",
            },
        )

    token = criar_token_acesso(
        usuario["id_usuario"],
    )

    return {
        "id_usuario": usuario["id_usuario"],
        "nome_exibicao": usuario["nome_exibicao"],
        "email_usuario": usuario["email_usuario"],
        "tipo_usuario": usuario["tipo_usuario"],
        "access_token": token,
        "token_type": "bearer",
        "expires_in": DURACAO_TOKEN_MINUTOS * 60,
    }


@router.get(
    "/me",
    response_model=UsuarioAutenticadoSaida,
)
def consultar_usuario_autenticado(
    response: Response,
    usuario: Annotated[
        dict,
        Depends(obter_usuario_atual),
    ],
):
    response.headers["Cache-Control"] = "no-store"

    return usuario
