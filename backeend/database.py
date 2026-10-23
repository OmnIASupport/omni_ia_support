import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import Client, create_client

#ler o arquvo .env da pasta deste arquivo
caminho_env = Path(__file__).with_name(".env")
load_dotenv(caminho_env,override=True)

url = os.getenv("SUPABASE_URL")
chave = os.getenv("SUPABASE_SECRET_KEY")

if not url or not chave:
    raise RuntimeError(
        "Configure SUPABASE_URL e SUPABASE_SECRET_KEY no arquivo .env"
    )

#Acesso à Data API por HTTPS
supabase: Client = create_client(url, chave)