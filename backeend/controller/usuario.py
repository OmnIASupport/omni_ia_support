from datetime import datetime, timezone
from typing import Annotated


from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)
from postgrest.exceptions import APIError
from pwdlib import PasswordHash


from database import supabase
from models import (
    UsuarioEntrada,
    UsuarioAtualizacao,
    UsuarioPerfilAtualizacao,
    UsuarioSaida,
    TrocaSenha,
    RegistroAcesso,
    RegistroTraducao,
)
from seguranca import obter_usuario_atual



router = APIRouter(
    prefix="/usuarios",
    tags=["Usuários"],
)


password_hash = PasswordHash.recommended()


# Não busca senha nem hash nas respostas públicas.
COLUNAS_PUBLICAS = (
    "id_usuario,"
    "nome_exibicao,"
    "nome_completo,"
    "email_usuario,"
    "telefone_usuario,"
    "tipo_usuario,"
    "status_usuario,"
    "criado_em,"
    "atualizado_em,"
    "ultimo_acesso,"
    "total_traducoes"
)


NIVEIS_EDITAVEIS = {"surdo", "ouvinte", "ambos"}



def tratar_duplicidade(erro: APIError) -> None:
    if erro.code == "23505":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um usuário com esse e-mail.",
        ) from None



# Cadastrar usuário com senha protegida por hash.
@router.post(
    "/",
    response_model=UsuarioSaida,
    status_code=status.HTTP_201_CREATED,
)
def cadastrar_usuario(dados: UsuarioEntrada):
    conteudo = dados.model_dump(
        mode="json",
        exclude={"senha_usuario"},
    )


    senha_original = dados.senha_usuario.get_secret_value()


    conteudo["senha_usuario"] = password_hash.hash(
        senha_original
    )


    try:
        resposta = (
            supabase.table("usuario")
            .insert(conteudo)
            .select(COLUNAS_PUBLICAS)
            .execute()
        )
    except APIError as erro:
        tratar_duplicidade(erro)
        raise


    if not resposta.data:
        raise HTTPException(
            status_code=502,
            detail="O Supabase não retornou o usuário cadastrado.",
        )


    return resposta.data[0]



# Consultar os dados do usuário autenticado.
# Deve ficar antes de "/{id_usuario}".
@router.get(
    "/me",
    response_model=UsuarioSaida,
)
def consultar_meu_usuario(
    response: Response,
    usuario: Annotated[
        dict,
        Depends(obter_usuario_atual),
    ],
):
    response.headers["Cache-Control"] = "no-store"


    resposta = (
        supabase.table("usuario")
        .select(COLUNAS_PUBLICAS)
        .eq("id_usuario", usuario["id_usuario"])
        .limit(1)
        .execute()
    )


    if not resposta.data:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )


    return resposta.data[0]



# Atualizar somente os dados permitidos do usuário autenticado.
@router.patch(
    "/me",
    response_model=UsuarioSaida,
)
def atualizar_meu_usuario(
    dados: UsuarioPerfilAtualizacao,
    response: Response,
    usuario: Annotated[
        dict,
        Depends(obter_usuario_atual),
    ],
):
    response.headers["Cache-Control"] = "no-store"


    campos = dados.model_dump(
        mode="json",
        exclude_unset=True,
    )


    if not campos:
        raise HTTPException(
            status_code=400,
            detail="Informe pelo menos um campo para atualizar.",
        )


    # Contas com outro tipo não trocam de tipo por esta tela.
    if (
        "tipo_usuario" in campos
        and usuario["tipo_usuario"] not in NIVEIS_EDITAVEIS
    ):
        raise HTTPException(
            status_code=403,
            detail="O tipo desta conta não pode ser alterado aqui.",
        )


    campos["atualizado_em"] = datetime.now(
        timezone.utc
    ).isoformat()


    resposta = (
        supabase.table("usuario")
        .update(campos)
        .eq("id_usuario", usuario["id_usuario"])
        .select(COLUNAS_PUBLICAS)
        .execute()
    )


    if not resposta.data:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )


    return resposta.data[0]



# Trocar a senha do usuário autenticado.
# Exige a senha atual e grava a nova senha com hash.
# Deve ficar antes de "/{id_usuario}".
@router.post(
    "/trocar-senha",
    status_code=status.HTTP_204_NO_CONTENT,
)
def trocar_senha(
    dados: TrocaSenha,
    response: Response,
    usuario: Annotated[
        dict,
        Depends(obter_usuario_atual),
    ],
):
    response.headers["Cache-Control"] = "no-store"


    resposta = (
        supabase.table("usuario")
        .select("id_usuario,senha_usuario")
        .eq("id_usuario", usuario["id_usuario"])
        .limit(1)
        .execute()
    )


    if not resposta.data:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )


    hash_salvo = resposta.data[0]["senha_usuario"]


    senha_atual = dados.senha_atual.get_secret_value()


    if not password_hash.verify(
        senha_atual,
        hash_salvo,
    ):
        raise HTTPException(
            status_code=400,
            detail="A senha atual está incorreta.",
        )


    senha_nova = dados.senha_nova.get_secret_value()


    if password_hash.verify(
        senha_nova,
        hash_salvo,
    ):
        raise HTTPException(
            status_code=400,
            detail="A nova senha deve ser diferente da atual.",
        )


    novo_hash = password_hash.hash(senha_nova)


    atualizacao = (
        supabase.table("usuario")
        .update(
            {
                "senha_usuario": novo_hash,
                "atualizado_em": datetime.now(
                    timezone.utc
                ).isoformat(),
            }
        )
        .eq("id_usuario", usuario["id_usuario"])
        .execute()
    )


    if not atualizacao.data:
        raise HTTPException(
            status_code=500,
            detail="Não foi possível atualizar a senha.",
        )


    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )



# Registrar o último acesso do usuário autenticado.
# Chamado após o login bem-sucedido.
@router.post(
    "/me/registrar-acesso",
    status_code=status.HTTP_204_NO_CONTENT,
)
def registrar_acesso(
    dados: RegistroAcesso,
    response: Response,
    usuario: Annotated[
        dict,
        Depends(obter_usuario_atual),
    ],
):
    response.headers["Cache-Control"] = "no-store"


    agora = datetime.now(timezone.utc).isoformat()


    atualizacao = (
        supabase.table("usuario")
        .update({"ultimo_acesso": agora})
        .eq("id_usuario", usuario["id_usuario"])
        .execute()
    )


    if not atualizacao.data:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )


    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )



# Registrar uma tradução realizada.
# Chamado quando o usuário clica em "Traduzir".
@router.post(
    "/me/registrar-traducao",
    status_code=status.HTTP_204_NO_CONTENT,
)
def registrar_traducao(
    dados: RegistroTraducao,
    response: Response,
    usuario: Annotated[
        dict,
        Depends(obter_usuario_atual),
    ],
):
    response.headers["Cache-Control"] = "no-store"


    resposta = (
        supabase.table("usuario")
        .select("total_traducoes")
        .eq("id_usuario", usuario["id_usuario"])
        .limit(1)
        .execute()
    )


    if not resposta.data:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )


    total_atual = resposta.data[0]["total_traducoes"] or 0


    atualizacao = (
        supabase.table("usuario")
        .update(
            {
                "total_traducoes": total_atual + 1,
                "atualizado_em": datetime.now(
                    timezone.utc
                ).isoformat(),
            }
        )
        .eq("id_usuario", usuario["id_usuario"])
        .execute()
    )


    if not atualizacao.data:
        raise HTTPException(
            status_code=500,
            detail="Não foi possível registrar a tradução.",
        )


    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )



# Listar usuários sem expor senha ou hash.
@router.get(
    "/",
    response_model=list[UsuarioSaida],
)
def listar_usuarios():
    resposta = (
        supabase.table("usuario")
        .select(COLUNAS_PUBLICAS)
        .order("id_usuario")
        .execute()
    )


    return resposta.data



# Consultar usuário por ID.
@router.get(
    "/{id_usuario}",
    response_model=UsuarioSaida,
)
def consultar_usuario(id_usuario: int):
    resposta = (
        supabase.table("usuario")
        .select(COLUNAS_PUBLICAS)
        .eq("id_usuario", id_usuario)
        .execute()
    )


    if not resposta.data:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )


    return resposta.data[0]



# Atualizar os dados do usuário.
# Senha omitida ou null: mantém a senha existente.
@router.put(
    "/{id_usuario}",
    response_model=UsuarioSaida,
)
def atualizar_usuario(
    id_usuario: int,
    dados: UsuarioAtualizacao,
):
    conteudo = dados.model_dump(
        mode="json",
        exclude={"senha_usuario"},
    )


    if dados.senha_usuario is not None:
        senha_original = dados.senha_usuario.get_secret_value()


        conteudo["senha_usuario"] = password_hash.hash(
            senha_original
        )


    conteudo["atualizado_em"] = datetime.now(
        timezone.utc
    ).isoformat()


    try:
        resposta = (
            supabase.table("usuario")
            .update(conteudo)
            .eq("id_usuario", id_usuario)
            .select(COLUNAS_PUBLICAS)
            .execute()
        )
    except APIError as erro:
        tratar_duplicidade(erro)
        raise


    if not resposta.data:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )


    return resposta.data[0]



# Excluir usuário por ID.
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