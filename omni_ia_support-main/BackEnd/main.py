from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes import usuario, formato_idioma
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

# Registra os routers (cada um com suas rotas GET, POST)
app.include_router(usuario.router)
app.include_router(formato_idioma.router)