from pydantic import BaseModel, ConfigDict

class UsuarioCreate(BaseModel):
    nome_exibicao: str
    nome_completo: str | None = None
    email_usuario: str | None = None
    telefone_usuario: str | None = None
    tipo_usuario: str = "usuario"
    status_usuario: str = "ativo"

class UsuarioResponse(UsuarioCreate):
    id_usuario: int
    criado_em: str
    atualizado_em: str
    model_config = ConfigDict(from_attributes=True)