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


# =========================================================
# USUÁRIO
# =========================================================

# Dados enviados no cadastro.
class UsuarioEntrada(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nome_exibicao: str = Field(
        min_length=2,
        max_length=150,
    )

    nome_completo: str | None = Field(
        default=None,
        max_length=150,
    )

    email_usuario: str = Field(
        max_length=255,
    )

    telefone_usuario: str | None = Field(
        default=None,
        max_length=20,
    )

    tipo_usuario: Literal[
        "surdo",
        "ouvinte",
        "ambos",
    ]

    senha_usuario: SecretStr

    @field_validator("nome_exibicao")
    @classmethod
    def validar_nome_exibicao(cls, valor: str) -> str:
        valor = valor.strip()

        if len(valor) < 2:
            raise ValueError(
                "O nome de exibição deve ter pelo menos 2 caracteres."
            )

        return valor

    @field_validator("email_usuario")
    @classmethod
    def validar_email(cls, valor: str) -> str:
        valor = valor.strip().lower()

        if "@" not in valor or "." not in valor.split("@")[-1]:
            raise ValueError("Informe um e-mail válido.")

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

    @field_validator("senha_usuario")
    @classmethod
    def validar_senha(cls, valor: SecretStr) -> SecretStr:
        senha = valor.get_secret_value()

        if len(senha) < 6:
            raise ValueError(
                "A senha deve ter pelo menos 6 caracteres."
            )

        if len(senha) > 128:
            raise ValueError(
                "A senha deve ter até 128 caracteres."
            )

        if not any(caractere.isdigit() for caractere in senha):
            raise ValueError(
                "A senha deve conter pelo menos um número."
            )

        return valor


# Dados completos retornados pela API.
# Não inclui a senha nem o hash.
class UsuarioSaida(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        from_attributes=True,
    )

    id_usuario: int

    nome_exibicao: str

    nome_completo: str | None = None

    email_usuario: str

    telefone_usuario: str | None = None

    # Na saída, o banco é a fonte da verdade (aceita 'usuario', etc.).
    tipo_usuario: str

    status_usuario: str

    criado_em: datetime

    atualizado_em: datetime

    # Dados usados no Dashboard.
    ultimo_acesso: datetime | None = None

    total_traducoes: int = 0


# Atualização administrativa completa.
# Mantida para compatibilidade com as rotas antigas.
class UsuarioAtualizacao(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nome_exibicao: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    nome_completo: str | None = Field(
        default=None,
        max_length=150,
    )

    email_usuario: str | None = Field(
        default=None,
        max_length=255,
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

    status_usuario: str | None = None

    senha_usuario: SecretStr | None = None

    @field_validator("nome_exibicao")
    @classmethod
    def validar_nome_exibicao(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        valor = valor.strip()

        if len(valor) < 2:
            raise ValueError(
                "O nome de exibição deve ter pelo menos 2 caracteres."
            )

        return valor

    @field_validator("email_usuario")
    @classmethod
    def validar_email(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        valor = valor.strip().lower()

        if "@" not in valor or "." not in valor.split("@")[-1]:
            raise ValueError("Informe um e-mail válido.")

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

    @field_validator("senha_usuario")
    @classmethod
    def validar_senha(cls, valor: SecretStr | None) -> SecretStr | None:
        if valor is None:
            return None

        senha = valor.get_secret_value()

        if len(senha) < 6:
            raise ValueError(
                "A senha deve ter pelo menos 6 caracteres."
            )

        if len(senha) > 128:
            raise ValueError(
                "A senha deve ter até 128 caracteres."
            )

        if not any(caractere.isdigit() for caractere in senha):
            raise ValueError(
                "A senha deve conter pelo menos um número."
            )

        return valor

    @model_validator(mode="after")
    def validar_campos_nao_nulos(self):
        for campo in (
            "nome_exibicao",
            "email_usuario",
            "tipo_usuario",
            "status_usuario",
        ):
            if (
                campo in self.model_fields_set
                and getattr(self, campo) is None
            ):
                raise ValueError(
                    f"O campo {campo} não pode ser nulo."
                )

        return self


# =========================================================
# PERFIL DO USUÁRIO
# =========================================================

# Dados que o próprio usuário pode alterar na tela de perfil.
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


# =========================================================
# TROCA DE SENHA
# =========================================================

# Troca de senha: exige a senha atual e a nova senha.
class TrocaSenha(BaseModel):
    model_config = ConfigDict(extra="forbid")

    senha_atual: SecretStr

    senha_nova: SecretStr

    @field_validator("senha_nova")
    @classmethod
    def validar_senha_nova(cls, valor: SecretStr) -> SecretStr:
        senha = valor.get_secret_value()

        if len(senha) < 6:
            raise ValueError(
                "A nova senha deve ter pelo menos 6 caracteres."
            )

        if len(senha) > 128:
            raise ValueError(
                "A nova senha deve ter até 128 caracteres."
            )

        if not any(caractere.isdigit() for caractere in senha):
            raise ValueError(
                "A nova senha deve conter pelo menos um número."
            )

        return valor


# =========================================================
# REGISTROS DE USO
# =========================================================

# Registro de uso: atualiza o último acesso.
class RegistroAcesso(BaseModel):
    model_config = ConfigDict(extra="forbid")


# Registro de uso: soma uma tradução realizada.
class RegistroTraducao(BaseModel):
    model_config = ConfigDict(extra="forbid")


# =========================================================
# FORMATO / IDIOMA
# =========================================================

# Dados enviados no cadastro e na atualização (sem o ID).
class FormatoIdiomaEntrada(BaseModel):
    model_config = ConfigDict(extra="forbid")

    codigo_formato_idioma: str = Field(
        min_length=1,
        max_length=50,
    )

    nome_formato_idioma: str = Field(
        min_length=1,
        max_length=150,
    )

    tipo_formato_idioma: str = Field(
        min_length=1,
        max_length=50,
    )

    descricao_formato_idioma: str | None = Field(
        default=None,
    )

    situacao_formato_idioma: bool = True

    @field_validator(
        "codigo_formato_idioma",
        "nome_formato_idioma",
        "tipo_formato_idioma",
    )
    @classmethod
    def validar_texto_obrigatorio(cls, valor: str) -> str:
        valor = valor.strip()

        if not valor:
            raise ValueError("O campo não pode ficar vazio.")

        return valor

    @field_validator("descricao_formato_idioma")
    @classmethod
    def validar_descricao(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        valor = valor.strip()

        return valor or None


# Dados retornados pela API (linha do banco).
class FormatoIdiomaSaida(BaseModel):
    model_config = ConfigDict(
        extra="ignore",
        from_attributes=True,
    )

    id_formato_idioma: int

    codigo_formato_idioma: str

    nome_formato_idioma: str

    tipo_formato_idioma: str

    descricao_formato_idioma: str | None = None

    situacao_formato_idioma: bool


# =========================================================
# AUTENTICAÇÃO
# =========================================================

# Dados enviados no login.
# Não aplica as regras de criação de senha, para não bloquear
# contas antigas. Só limita o tamanho.
class LoginEntrada(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email_usuario: str = Field(
        max_length=255,
    )

    senha_usuario: SecretStr

    @field_validator("email_usuario")
    @classmethod
    def validar_email(cls, valor: str) -> str:
        valor = valor.strip().lower()

        if not valor:
            raise ValueError("Informe o e-mail.")

        return valor

    @field_validator("senha_usuario")
    @classmethod
    def validar_senha(cls, valor: SecretStr) -> SecretStr:
        senha = valor.get_secret_value()

        if not senha:
            raise ValueError("Informe a senha.")

        if len(senha) > 128:
            raise ValueError(
                "A senha deve ter até 128 caracteres."
            )

        return valor


# Dados retornados após o login (sem senha nem hash).
class LoginSaida(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id_usuario: int

    nome_exibicao: str

    email_usuario: str

    # Na saída, o banco é a fonte da verdade (aceita 'usuario', etc.).
    tipo_usuario: str

    access_token: str

    token_type: str = "bearer"

    expires_in: int


# Usuário identificado pelo token (GET /login/me).
class UsuarioAutenticadoSaida(BaseModel):
    model_config = ConfigDict(
        extra="ignore",
        from_attributes=True,
    )

    id_usuario: int

    nome_exibicao: str

    email_usuario: str

    # Na saída, o banco é a fonte da verdade (aceita 'usuario', etc.).
    tipo_usuario: str

    status_usuario: str | None = None