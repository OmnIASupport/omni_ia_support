from fastapi import APIRouter, HTTPException, status, Response

from database import supabase
from models import FormatoIdiomaEntrada, FormatoIdiomaSaida


router = APIRouter(
    prefix="/formatos-idioma",
    tags=["Formatos e idiomas"],
)


# Cadastrar: o banco gera o ID.
@router.post(
    "/",
    response_model=FormatoIdiomaSaida,
    status_code=status.HTTP_201_CREATED,
)
def cadastrar_formato_idioma(dados: FormatoIdiomaEntrada):
    conteudo = dados.model_dump(mode="json")

    resposta = (
        supabase.table("formato_idioma")
        .insert(conteudo)
        .execute()
    )

    if not resposta.data:
        raise HTTPException(
            status_code=502,
            detail=(
                "O Supabase não retornou o formato/idioma cadastrado."
            ),
        )

    return resposta.data[0]


# Listar os registros acessíveis, ordenados pelo ID.
@router.get(
    "/",
    response_model=list[FormatoIdiomaSaida],
)
def listar_formatos_idioma():
    resposta = (
        supabase.table("formato_idioma")
        .select("*")
        .order("id_formato_idioma")
        .execute()
    )

    return resposta.data

# Consultar um formato/idioma pelo ID.
@router.get(
    "/{id_formato_idioma}",
    response_model=FormatoIdiomaSaida,
)
def consultar_formato_idioma(id_formato_idioma: int):
    resposta = (
        supabase.table("formato_idioma")
        .select("*")
        .eq("id_formato_idioma", id_formato_idioma)
        .execute()
    )

    if not resposta.data:
        raise HTTPException(
            status_code=404,
            detail="Formato/idioma não encontrado.",
        )

    return resposta.data[0]


# Atualizar os campos editáveis de um formato/idioma.
@router.put(
    "/{id_formato_idioma}",
    response_model=FormatoIdiomaSaida,
)
def atualizar_formato_idioma(
    id_formato_idioma: int,
    dados: FormatoIdiomaEntrada,
):
    conteudo = dados.model_dump(mode="json")

    resposta = (
        supabase.table("formato_idioma")
        .update(conteudo)
        .eq("id_formato_idioma", id_formato_idioma)
        .execute()
    )

    if not resposta.data:
        raise HTTPException(
            status_code=404,
            detail="Formato/idioma não encontrado.",
        )

    return resposta.data[0]


# Excluir um formato/idioma pelo ID.
@router.delete(
    "/{id_formato_idioma}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def excluir_formato_idioma(id_formato_idioma: int):
    resposta = (
        supabase.table("formato_idioma")
        .delete()
        .eq("id_formato_idioma", id_formato_idioma)
        .execute()
    )

    if not resposta.data:
        raise HTTPException(
            status_code=404,
            detail="Formato/idioma não encontrado.",
        )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )