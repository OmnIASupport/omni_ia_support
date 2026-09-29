from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
from datetime import datetime

class usuario(Base):
     __tablename__ = "usuario"

     id_usuario: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome_exibicao: Mapped[str] = mapped_column(String(150), nullable=False)
    nome_completo: Mapped[str | None] = mapped_column(String(250), nullable=True)
    email_usuario: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telefone_usuario: Mapped[str | None] = mapped_column(String(20), nullable=True)
    tipo_usuario: Mapped[str] = mapped_column(String(50), nullable=False, default="usuario")
    status_usuario: Mapped[str] = mapped_column(String(30), nullable=False, default="ativo")
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(datetime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


