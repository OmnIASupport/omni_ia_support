from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)

from database import supabase
from models_perfil_acessibilidade import (
    PerfilAcessibilidadeEntrada,
    PerfilAcessibilidadeSaida,
    PerfilAcessibilidadeAtualizacao,
)
from postgrest.exceptions import APIError
from seguranca import obter_usuario_atual


router = APIRouter(
    prefix="/perfis_acessibilidade",
    tags=["Perfis de acessibilidade"],
)


# Colunas do perfil e nome do usuário relacionado.
COLUNAS = (
    "id_perfil_acessibilidade, "
    "id_usuario, "
    "prefere_legenda, "
    "tamanho_fonte, "
    "letra_destacada, "
    "modo_escuro, "
    "velocidade_audio, "
    "volume_audio, "
    "criado_em, "
    "atualizado_em, "
    "usuario:usuario!fk_perfil_acessibilidade_usuario("
    "nome_exibicao"
    ")"
)


def validar_usuario(id_usuario: int) -> None:
    resposta = (
        supabase.table("usuario")
        .select("id_usuario")
        .eq("id_usuario", id_usuario)
        .limit(1)
        .execute()
    )

    if not resposta.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Usuário não encontrado ou indisponível para "
                "esta operação. Informe o ID de um usuário cadastrado."
            ),
        )

def preparar_saida(registro: dict) -> dict:
    # O nome vem dentro do objeto relacionado "usuario".
    usuario = registro.get("usuario")

    if not isinstance(usuario, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Não foi possível consultar o usuário "
                "relacionado ao perfil de acessibilidade."
            ),
        )

    nome_exibicao = usuario.get("nome_exibicao")

    if (
        not isinstance(nome_exibicao, str)
        or not nome_exibicao.strip()
    ):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Não foi possível obter o nome de exibição "
                "do usuário relacionado ao perfil de acessibilidade."
            ),
        )

    return {
        "id_perfil_acessibilidade": (
            registro["id_perfil_acessibilidade"]
        ),
        "id_usuario": registro["id_usuario"],
        "nome_exibicao": nome_exibicao,
        "prefere_legenda": registro["prefere_legenda"],
        "tamanho_fonte": registro["tamanho_fonte"],
        "letra_destacada": registro["letra_destacada"],
        "modo_escuro": registro["modo_escuro"],
        "velocidade_audio": registro["velocidade_audio"],
        "volume_audio": registro["volume_audio"],
        "criado_em": registro["criado_em"],
        "atualizado_em": registro["atualizado_em"],
    }

def buscar_perfil(id_perfil_acessibilidade: int) -> dict:
    resposta = (
        supabase.table("perfil_acessibilidade")
        .select(COLUNAS)
        .eq(
            "id_perfil_acessibilidade",
            id_perfil_acessibilidade,
        )
        .limit(1)
        .execute()
    )

    if not resposta.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de acessibilidade não encontrado.",
        )

    return preparar_saida(resposta.data[0])

def preparar_atualizacao(
    dados: PerfilAcessibilidadeAtualizacao,
) -> dict:
    # Mantém apenas os campos que o usuário enviou.
    campos = dados.model_dump(
        exclude_unset=True,
        mode="json",
    )

    if not campos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Informe pelo menos um campo para atualizar "
                "o perfil de acessibilidade."
            ),
        )

    return campos

@router.post(
    "/",
    response_model=PerfilAcessibilidadeSaida,
    status_code=status.HTTP_201_CREATED,
)
def cadastrar_perfil(
    dados: PerfilAcessibilidadeEntrada,
    usuario: Annotated[
        dict,
        Depends(obter_usuario_atual),
    ],
):
    id_usuario = usuario["id_usuario"]

    try:
        resposta = (
            supabase.table("perfil_acessibilidade")
            .insert(
                {
                    **dados.model_dump(mode="json"),
                    "id_usuario": id_usuario,
                }
            )
            .execute()
        )
    except APIError as erro:
        if erro.code == "23505":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Você já possui um perfil de acessibilidade."
                ),
            ) from erro

        if erro.code == "23503":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "A conta vinculada à sua sessão não está "
                    "mais disponível para criar o perfil."
                ),
            ) from erro

        raise

    if not resposta.data:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "O Supabase não retornou o perfil cadastrado. "
                "Confira os registros antes de tentar novamente."
            ),
        )

    id_novo = resposta.data[0].get(
        "id_perfil_acessibilidade"
    )

    if id_novo is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "O Supabase respondeu sem o ID do perfil "
                "cadastrado. Confira os registros antes de "
                "tentar novamente."
            ),
        )

    return buscar_perfil(id_novo)

@router.get(
    "/meu",
    response_model=PerfilAcessibilidadeSaida | None,
)
def consultar_meu_perfil(
    response: Response,
    usuario: Annotated[
        dict,
        Depends(obter_usuario_atual),
    ],
):
    response.headers["Cache-Control"] = "no-store"

    resposta = (
        supabase.table("perfil_acessibilidade")
        .select(COLUNAS)
        .eq(
            "id_usuario",
            usuario["id_usuario"],
        )
        .limit(1)
        .execute()
    )

    if not resposta.data:
        return None

    return preparar_saida(resposta.data[0])


@router.get(
    "/{id_perfil_acessibilidade}",
    response_model=PerfilAcessibilidadeSaida,
)
def consultar_perfil(
    id_perfil_acessibilidade: int,
    usuario: Annotated[
        dict,
        Depends(obter_usuario_atual),
    ],
):
    perfil = buscar_perfil(id_perfil_acessibilidade)

    if perfil["id_usuario"] != usuario["id_usuario"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de acessibilidade não encontrado.",
        )

    return perfil

@router.patch(
    "/{id_perfil_acessibilidade}",
    response_model=PerfilAcessibilidadeSaida,
)
def atualizar_perfil(
    id_perfil_acessibilidade: int,
    dados: PerfilAcessibilidadeAtualizacao,
    usuario: Annotated[
        dict,
        Depends(obter_usuario_atual),
    ],
):
    perfil = buscar_perfil(id_perfil_acessibilidade)

    if perfil["id_usuario"] != usuario["id_usuario"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de acessibilidade não encontrado.",
        )

    campos = preparar_atualizacao(dados)

    if not campos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Informe pelo menos um campo para atualizar "
                "o perfil de acessibilidade."
            ),
        )

    resposta = (
        supabase.table("perfil_acessibilidade")
        .update(campos)
        .eq(
            "id_perfil_acessibilidade",
            id_perfil_acessibilidade,
        )
        .execute()
    )

    if not resposta.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de acessibilidade não encontrado.",
        )

    return buscar_perfil(id_perfil_acessibilidade)

@router.delete(
    "/{id_perfil_acessibilidade}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def excluir_perfil(
    id_perfil_acessibilidade: int,
    usuario: Annotated[
        dict,
        Depends(obter_usuario_atual),
    ],
):
    perfil = buscar_perfil(id_perfil_acessibilidade)

    if perfil["id_usuario"] != usuario["id_usuario"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de acessibilidade não encontrado.",
        )

    resposta = (
        supabase.table("perfil_acessibilidade")
        .delete()
        .eq(
            "id_perfil_acessibilidade",
            id_perfil_acessibilidade,
        )
        .execute()
    )

    if not resposta.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de acessibilidade não encontrado.",
        )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )