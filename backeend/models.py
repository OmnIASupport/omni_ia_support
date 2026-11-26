from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    SecretStr,
    field_validator,
    model_validator,
)


# 1. Primeiro: classe base.
class UsuarioBase(BaseModel):
    nome_exibicao: str = Field(
        min_length=1,
        max_length=150,
    )

    nome_completo: str | None = Field(
        default=None,
        max_length=250,
    )

    email_usuario: str | None = Field(
        default=None,
        max_length=255,
    )

    telefone_usuario: str | None = Field(
        default=None,
        max_length=20,
    )

    tipo_usuario: str = Field(
        default="usuario",
        min_length=1,
        max_length=50,
    )

    status_usuario: str = Field(
        default="ativo",
        min_length=1,
        max_length=30,
    )

    @field_validator(
        "nome_exibicao",
        "tipo_usuario",
        "status_usuario",
    )
    @classmethod
    def validar_textos_obrigatorios(cls, valor: str) -> str:
        valor = valor.strip()

        if not valor:
            raise ValueError(
                "O campo não pode ficar vazio ou conter apenas espaços."
            )

        return valor

    @field_validator("nome_completo")
    @classmethod
    def validar_nome_completo(
        cls,
        valor: str | None,
    ) -> str | None:
        if valor is None:
            return None

        valor = valor.strip()

        if not valor:
            return None

        if any(caractere.isnumeric() for caractere in valor):
            raise ValueError(
                "O nome completo não pode conter números."
            )

        return valor


# 2. Depois: entrada do cadastro.
class UsuarioEntrada(UsuarioBase):
    senha_usuario: SecretStr = Field(
        min_length=6,
        max_length=128,
    )


# 3. Depois: entrada da atualização.
class UsuarioAtualizacao(UsuarioBase):
    senha_usuario: SecretStr | None = Field(
        default=None,
        min_length=6,
        max_length=128,
    )


# 4. Por último: resposta pública.
class UsuarioSaida(UsuarioBase):
    id_usuario: int
    criado_em: datetime
    atualizado_em: datetime

# FORMATO_IDIOMA


class FormatoIdiomaEntrada(BaseModel):
    codigo_formato_idioma: str = Field(
        min_length=1,
        max_length=30,
    )

    nome_formato_idioma: str = Field(
        min_length=1,
        max_length=100,
    )

    tipo_formato_idioma: str = Field(
        min_length=1,
        max_length=30,
    )

    descricao_formato_idioma: str | None = None

    situacao_formato_idioma: bool = True

    @field_validator(
        "codigo_formato_idioma",
        "nome_formato_idioma",
        "tipo_formato_idioma",
    )
    @classmethod
    def validar_textos_obrigatorios(cls, valor: str) -> str:
        valor = valor.strip()

        if not valor:
            raise ValueError(
                "O campo não pode ficar vazio ou conter apenas espaços."
            )

        return valor


class FormatoIdiomaSaida(FormatoIdiomaEntrada):
    id_formato_idioma: int

# LOGIN: 

class LoginEntrada(BaseModel):
    email_usuario: str = Field(
        min_length=1,
        max_length=255,
    )

    senha_usuario: SecretStr = Field(
        min_length=1,
        max_length=128,
    )

    @field_validator("email_usuario")
    @classmethod
    def normalizar_email(cls, valor: str) -> str:
        valor = valor.strip().lower()

        if not valor:
            raise ValueError("Informe seu e-mail.")

        return valor


class UsuarioAutenticadoSaida(BaseModel):
    id_usuario: int
    nome_exibicao: str
    email_usuario: str | None
    tipo_usuario: str


class LoginSaida(UsuarioAutenticadoSaida):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

# PERFIL: dados que o próprio usuário pode alterar.
class UsuarioPerfilAtualizacao(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nome_exibicao: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    telefone_usuario: str | None = Field(
        default=None,
        max_length=20,
    )

    tipo_usuario: Literal[
        "surdo",
        "ouvinte",
        "ambos",
    ] | None = None

    @field_validator("nome_exibicao")
    @classmethod
    def validar_nome(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        valor = valor.strip()

        if len(valor) < 2:
            raise ValueError(
                "O nome de exibição deve ter pelo menos 2 caracteres."
            )

        return valor

    @field_validator("telefone_usuario")
    @classmethod
    def validar_telefone(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        digitos = "".join(
            caractere
            for caractere in valor
            if caractere.isdigit()
        )

        if not digitos:
            return None

        if len(digitos) not in (10, 11):
            raise ValueError(
                "Informe um telefone com DDD e 10 ou 11 dígitos."
            )

        return digitos

    @model_validator(mode="after")
    def validar_campos_nao_nulos(self):
        for campo in ("nome_exibicao", "tipo_usuario"):
            if (
                campo in self.model_fields_set
                and getattr(self, campo) is None
            ):
                raise ValueError(
                    f"O campo {campo} não pode ser nulo."
                )

        return self