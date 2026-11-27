"""Cliente mínimo do Ollama Local (sem dependências extras, apenas urllib)."""
from __future__ import annotations

import json
import os
import urllib.request

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434/api/chat")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:1b")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "120"))
OLLAMA_NUM_GPU = int(os.getenv("OLLAMA_NUM_GPU", "0"))


def conversar(prompt_sistema: str, conteudo: str, num_predict: int = 400) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_predict": num_predict,
            "num_ctx": 2048,
            "num_gpu": OLLAMA_NUM_GPU,
        },
        "messages": [
            {"role": "system", "content": prompt_sistema},
            {"role": "user", "content": conteudo},
        ],
    }
    req = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=OLLAMA_TIMEOUT) as resposta:
        dados = json.loads(resposta.read().decode("utf-8"))
    return dados.get("message", {}).get("content", "").strip()


def status() -> dict:
    tags_url = OLLAMA_URL.rsplit("/api/", 1)[0] + "/api/tags"
    try:
        with urllib.request.urlopen(tags_url, timeout=3) as resposta:
            dados = json.loads(resposta.read().decode("utf-8"))
        modelos = [m.get("name", "") for m in dados.get("models", [])]
        base = OLLAMA_MODEL if ":" in OLLAMA_MODEL else f"{OLLAMA_MODEL}:latest"
        return {
            "conectado": True,
            "modelo_configurado": OLLAMA_MODEL,
            "modelo_instalado": OLLAMA_MODEL in modelos or base in modelos,
            "modelos_disponiveis": modelos,
        }
    except Exception:
        return {"conectado": False, "modelo_configurado": OLLAMA_MODEL, "modelo_instalado": False}
