from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Usuario
from schemas import UsuarioResponse

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

@router.get("/", response_model=list[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()

from models import FormatoIdioma
from schemas import FormatoIdiomaResponse

router = APIRouter(prefix="/formatos-idioma", tags=["formatos-idioma"])

@router.get("/", response_model=list[FormatoIdiomaResponse])
def listar_formatos_idioma(db: Session = Depends(get_db)):
    return db.query(FormatoIdioma).all()