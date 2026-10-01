from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import FormatoIdioma
from schemas import FormatoIdiomaCreate, FormatoIdiomaResponse

router = APIRouter(prefix="/formatos-idioma", tags=["formatos-idioma"])

@router.get("/", response_model=list[FormatoIdiomaResponse])
def listar_formatos_idioma(db: Session = Depends(get_db)):
     return db.query(FormatoIdioma).all()


@router.post(
    "/",
    response_model=FormatoIdiomaResponse,
    status_code=status.HTTP_201_CREATED
)
def criar_formato_idioma(dados: FormatoIdiomaCreate, db: Session = Depends(get_db)):
    formato = FormatoIdioma(
        codigo_formato_idioma=dados.codigo_formato_idioma,
        nome_formato_idioma=dados.nome_formato_idioma,
        tipo_formato_idioma=dados.tipo_formato_idioma,
        descricao_formato_idioma=dados.descricao_formato_idioma,
        situacao_formato_idioma=dados.situacao_formato_idioma,
    )
    db.add(formato)
    db.commit()
    db.refresh(formato)
    return formato