from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field


class PerfilAcessibilidadeEntrada(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Preferências de apresentação.
    prefere_legenda: bool = False

    tamanho_fonte: Literal[
        "pequeno",
        "medio",
        "grande",
    ] = "medio"

    letra_destacada: bool = False
    modo_escuro: bool = False

    # Regras de negócio propostas para o áudio.
    velocidade_audio: Decimal = Field(
        default=Decimal("1.00"),
        ge=Decimal("0.50"),
        le=Decimal("2.00"),
        max_digits=3,
        decimal_places=2,
    )

    volume_audio: Decimal = Field(
        default=Decimal("1.00"),
        ge=Decimal("0.00"),
        le=Decimal("1.00"),
        max_digits=3,
        decimal_places=2,
    )


class PerfilAcessibilidadeSaida(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id_perfil_acessibilidade: int
    id_usuario: int

    # Obtido pela consulta do usuário relacionado.
    nome_exibicao: str

    prefere_legenda: bool

    # Estas colunas aceitam NULL no SQL apresentado.
    tamanho_fonte: str | None
    letra_destacada: bool
    modo_escuro: bool

    velocidade_audio: Decimal | None
    volume_audio: Decimal | None

    criado_em: datetime
    atualizado_em: datetime

class PerfilAcessibilidadeAtualizacao(BaseModel):
    """Dados opcionais para atualizar um perfil de acessibilidade."""

    model_config = ConfigDict(extra="forbid")

    prefere_legenda: bool | None = None
    tamanho_fonte: Literal[
        "pequeno",
        "medio",
        "grande",
    ] | None = None
    letra_destacada: bool | None = None
    modo_escuro: bool | None = None
    velocidade_audio: (
        Annotated[
            Decimal,
            Field(
                ge=Decimal("0.50"),
                le=Decimal("2.00"),
                max_digits=3,
                decimal_places=2,
            ),
        ]
        | None
    ) = None
    volume_audio: (
        Annotated[
            Decimal,
            Field(
                ge=Decimal("0.00"),
                le=Decimal("1.00"),
                max_digits=3,
                decimal_places=2,
            ),
        ]
        | None
    ) = None

