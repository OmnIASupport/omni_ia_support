from dotenv import load_dotenv
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Lê as variáveis que estão no arquivo .env
load_dotenv()

# Pega o valor de DATABASE_URL do .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Interrompe a execução com uma mensagem clara caso o .env não seja encontrado
# ou a variável DATABASE_URL não exista nele.
if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL não foi encontrada. "
        "Confira o arquivo .env na raiz do projeto."
    )


# Cria a conexão com o PostgreSQL/Supabase
engine = create_engine(
    DATABASE_URL,
    connect_args={"connect_timeout": 10}
)

# Cria uma fábrica de sessões para acessar o banco
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Classe base que seus models herdam
Base = declarative_base()


# Função usada nas rotas com Depends(get_db)
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()