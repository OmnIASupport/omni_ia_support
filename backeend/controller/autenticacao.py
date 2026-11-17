
# Omni IA Support — Verificação de login
#
# POST /login/
# - Recebe e-mail e senha.
# - Consulta o usuário no Supabase.
# - Verifica a senha contra o hash salvo.
# - Retorna somente dados públicos.
#
# Não cria token ou sessão nesta etapa.


import logging

from fastapi import APIRouter, HTTPException, Response, status
from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError

from database import supabase
from models import LoginEntrada, LoginSaida


logger = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/login",
    tags=["Autenticação"],
)

password_hash = PasswordHash.recommended()

# Gerado uma vez ao carregar este módulo.
# Permite executar uma verificação mesmo quando o e-mail não existe.
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
    # Evita armazenar a resposta de login em cache HTTP.
    response.headers["Cache-Control"] = "no-store"

    # Consulta somente as colunas necessárias.
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

    # O hash nunca é enviado ao frontend.
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
        # Não registra senha, hash ou dados completos do usuário.
        logger.error(
            "Login recusado: hash de senha não reconhecido."
        )

        senha_valida = False

    # A mesma mensagem é usada para:
    # - e-mail inexistente;
    # - senha incorreta;
    # - usuário inativo;
    # - senha sem hash válido.
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

    return {
        "id_usuario": usuario["id_usuario"],
        "nome_exibicao": usuario["nome_exibicao"],
        "email_usuario": usuario["email_usuario"],
        "tipo_usuario": usuario["tipo_usuario"],
    }