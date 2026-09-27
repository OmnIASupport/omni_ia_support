from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

#configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Caminhos do projeto
BASE_DIR = os.path.dirname(os.path.abspath(__file__))   # pasta backend
PROJECT_DIR = os.path.dirname(BASE_DIR)                 # pasta raiz do projeto
FRONTEND_DIR = os.path.join(PROJECT_DIR, "frontend")    # pasta frontend
INDEX_FILE = os.path.join(FRONTEND_DIR, "index.html")   # arquivo index.html


# Monta a pasta frontend como estática
app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")

# Rota principal que abre o HTML
@app.get("/")
def home():
    return FileResponse(INDEX_FILE)