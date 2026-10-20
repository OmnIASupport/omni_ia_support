from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from database import get_db
from models import Usuario
from schemas import UsuarioCreate, UsuarioResponse

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

@router.get("/", response_model=list[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()


@router.post(
    "/",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED
)
def criar_usuario(dados: UsuarioCreate, db: Session = Depends(get_db)):
    usuario = Usuario(
        nome_exibicao=dados.nome_exibicao,
        nome_completo=dados.nome_completo,
        email_usuario=dados.email_usuario,
        telefone_usuario=dados.telefone_usuario,
        tipo_usuario=dados.tipo_usuario,
        status_usuario=dados.status_usuario,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario