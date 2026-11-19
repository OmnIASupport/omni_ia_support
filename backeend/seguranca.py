# Omni IA Support — Emissão e validação de credenciais.

import os

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated

import jwt

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from jwt.exceptions import InvalidTokenError

from database import supabase


load_dotenv(Path(__file__).resolve().parent / ".env")

CHAVE_JWT = os.getenv("JWT_SECRET_KEY", "")

if len(CHAVE_JWT.encode("utf-8")) < 32:
    raise RuntimeError(
        "Configure JWT_SECRET_KEY no .env do backend "
        "com um segredo aleatório de pelo menos 32 bytes."
    )

ALGORITMO_JWT = "HS256"
DURACAO_TOKEN_MINUTOS = 30
EMISSOR_JWT = "omni-ia-support-api"
PUBLICO_JWT = "omni-ia-support-frontend"

esquema_bearer = HTTPBearer(auto_error=False)


def erro_autenticacao() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sessão inválida ou expirada. Entre novamente.",
        headers={
            "WWW-Authenticate": "Bearer",
            "Cache-Control": "no-store",
        },
    )


def criar_token_acesso(id_usuario: int) -> str:
    agora = datetime.now(timezone.utc)

    conteudo = {
        "sub": str(id_usuario),
        "iat": agora,
        "exp": agora + timedelta(
            minutes=DURACAO_TOKEN_MINUTOS,
        ),
        "iss": EMISSOR_JWT,
        "aud": PUBLICO_JWT,
    }

    return jwt.encode(
        conteudo,
        CHAVE_JWT,
        algorithm=ALGORITMO_JWT,
    )


def obter_usuario_atual(
    credenciais: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(esquema_bearer),
    ],
) -> dict:
    if credenciais is None:
        raise erro_autenticacao()

    try:
        conteudo = jwt.decode(
            credenciais.credentials,
            CHAVE_JWT,
            algorithms=[ALGORITMO_JWT],
            issuer=EMISSOR_JWT,
            audience=PUBLICO_JWT,
            options={
                "require": [
                    "sub",
                    "iat",
                    "exp",
                    "iss",
                    "aud",
                ],
            },
        )

        identificador = conteudo["sub"]

        if not isinstance(identificador, str):
            raise erro_autenticacao()

        id_usuario = int(identificador)

        if id_usuario <= 0:
            raise erro_autenticacao()

    except (InvalidTokenError, ValueError, TypeError):
        raise erro_autenticacao() from None

    resposta = (
        supabase.table("usuario")
        .select(
            "id_usuario,"
            "nome_exibicao,"
            "email_usuario,"
            "tipo_usuario,"
            "status_usuario"
        )
        .eq("id_usuario", id_usuario)
        .limit(1)
        .execute()
    )

    usuario = resposta.data[0] if resposta.data else None

    if (
        usuario is None
        or usuario.get("status_usuario") != "ativo"
    ):
        raise erro_autenticacao()

    return {
        "id_usuario": usuario["id_usuario"],
        "nome_exibicao": usuario["nome_exibicao"],
        "email_usuario": usuario["email_usuario"],
        "tipo_usuario": usuario["tipo_usuario"],
    }