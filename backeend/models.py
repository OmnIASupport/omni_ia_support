from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
from datetime import datetime
from datetime import datetime, timezone

class usuario(Base):
     __tablename__ = "usuario"

     id_usuario: Mapped[int] = mapped_column(Integer, primary_key=True)
     nome_exibicao: Mapped[str] = mapped_column(String(150), nullable=False)
     nome_completo: Mapped[str | None] = mapped_column(String(250), nullable=True)
     email_usuario: Mapped[str | None] = mapped_column(String(255), nullable=True)
     telefone_usuario: Mapped[str | None] = mapped_column(String(20), nullable=True)
     tipo_usuario: Mapped[str] = mapped_column(String(50), nullable=False, default="usuario")
     status_usuario: Mapped[str] = mapped_column(String(30), nullable=False, default="ativo")
     criado_em: Mapped[datetime] = mapped_column(datetime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
     atualizado_em: Mapped[datetime] = mapped_column(datetime(timezone=True), nullable=False,default=lambda: datetime.now(timezone.utc), default=lambda: datetime.now(timezone.utc))

class formato_idioma(Base):
     __tablename__= "formato_idioma"

     id_formato_idioma: Mapped[int] = mapped_column(Integer, primary_key=True)
     codigo_formato_idioma: Mapped[str] = mapped_column(String(30), nullable=False)
     nome_formato_idioma: Mapped[str] = mapped_column(String(100), nullable=False)
     tipo_formato_idioma: Mapped[str] = mapped_column(String(30), nullable=False)
     descricao_formato_idioma: Mapped[str | None] = mapped_column(Text, nullable=True)
     situacao_formato_idioma: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


