#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PORTA_API="${OMNI_PORTA_API:-8001}"
PORTA_SITE="${OMNI_PORTA_SITE:-5501}"
export OMNI_PORTA_SITE="$PORTA_SITE"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Erro: Python 3 não foi encontrado. Instale o Python 3 e tente novamente."
  exit 1
fi

if [[ ! -d .venv ]]; then
  echo "Criando ambiente virtual..."
  python3 -m venv .venv
fi

if ! .venv/bin/python -c 'import fastapi, uvicorn, pandas, sqlalchemy, sklearn, joblib' >/dev/null 2>&1; then
  echo "Instalando dependências do projeto..."
  .venv/bin/python -m pip install -r backend/requirements.txt
fi

if [[ ! -f modelo/modelo_arvore.joblib ]]; then
  echo "Treinando a Árvore de Decisão (primeira execução)..."
  .venv/bin/python -m backend.treinar_modelo
fi

cleanup() {
  printf '\nEncerrando os serviços...\n'
  [[ -n "${API_PID:-}" ]] && kill "$API_PID" 2>/dev/null || true
  [[ -n "${WEB_PID:-}" ]] && kill "$WEB_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port "$PORTA_API" &
API_PID=$!
(cd frontend && python3 -m http.server "$PORTA_SITE" --bind 127.0.0.1) &
WEB_PID=$!

printf '\nOmni IA Support iniciado.\n'
printf 'Dashboard:   http://127.0.0.1:%s/pages/dashboard.html\n' "$PORTA_SITE"
printf 'Resumo:      http://127.0.0.1:%s/pages/resumo.html\n' "$PORTA_SITE"
printf 'Omni IA:     http://127.0.0.1:%s/pages/chat.html\n' "$PORTA_SITE"
printf 'Modelo IA:   http://127.0.0.1:%s/pages/modelo.html\n' "$PORTA_SITE"
printf 'API Docs:    http://127.0.0.1:%s/docs\n' "$PORTA_API"
printf '\nMantenha este terminal aberto. Pressione Ctrl+C para encerrar.\n\n'
wait -n "$API_PID" "$WEB_PID"
