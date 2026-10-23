from fastapi import APIRouter, HTTPException, status, Response

from database import supabase
from models import UsuarioEntrada, UsuarioSaida


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuários"],
)


# Cadastrar: o banco gera o ID e as datas.
@router.post(
    "/",
    response_model=UsuarioSaida,
    status_code=status.HTTP_201_CREATED,
)
def cadastrar_usuario(dados: UsuarioEntrada):
    conteudo = dados.model_dump(mode="json")

    resposta = (
        supabase.table("usuario")
        .insert(conteudo)
        .execute()
    )

    if not resposta.data:
        raise HTTPException(
            status_code=502,
            detail="O Supabase não retornou o usuário cadastrado.",
        )

    return resposta.data[0]


# Listar os registros acessíveis, ordenados pelo ID.
@router.get("/", response_model=list[UsuarioSaida])
def listar_usuarios():
    resposta = (
        supabase.table("usuario")
        .select("*")
        .order("id_usuario")
        .execute()
    )

    return resposta.data

# Consultar um usuário pelo ID.
@router.get(
    "/{id_usuario}",
    response_model=UsuarioSaida,
)
def consultar_usuario(id_usuario: int):
    resposta = (
        supabase.table("usuario")
        .select("*")
        .eq("id_usuario", id_usuario)
        .execute()
    )

    if not resposta.data:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )

    return resposta.data[0]


# Atualizar os campos editáveis de um usuário.
@router.put(
    "/{id_usuario}",
    response_model=UsuarioSaida,
)
def atualizar_usuario(
    id_usuario: int,
    dados: UsuarioEntrada,
):
    conteudo = dados.model_dump(mode="json")

    resposta = (
        supabase.table("usuario")
        .update(conteudo)
        .eq("id_usuario", id_usuario)
        .execute()
    )

    if not resposta.data:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )

    return resposta.data[0]


# Excluir um usuário pelo ID.
@router.delete(
    "/{id_usuario}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def excluir_usuario(id_usuario: int):
    resposta = (
        supabase.table("usuario")
        .delete()
        .eq("id_usuario", id_usuario)
        .execute()
    )

    if not resposta.data:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )