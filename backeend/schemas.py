from pydantic import BaseModel, ConfigDict
from datetime import datetime

class UsuarioCreate(BaseModel):
    nome_exibicao: str
    nome_completo: str | None = None
    email_usuario: str | None = None
    telefone_usuario: str | None = None
    tipo_usuario: str = "usuario"
    status_usuario: str = "ativo"

class UsuarioResponse(UsuarioCreate):
    id_usuario: int
    criado_em: datetime
    atualizado_em: datetime
    model_config = ConfigDict(from_attributes=True)


class FormatoIdiomaCreate(BaseModel):
    codigo_formato_idioma: str
    nome_formato_idioma: str
    tipo_formato_idioma: str
    descricao_formato_idioma: str | None = None
    situacao_formato_idioma: bool = True

class FormatoIdiomaResponse(FormatoIdiomaCreate):
    id_formato_idioma: int
    model_config = ConfigDict(from_attributes=True)