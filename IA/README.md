# Omni IA Support — Dados, IA e Acessibilidade

Painel de análise do dataset **simulado** de solicitações de tradução do Omni IA Support
(texto, áudio, vídeo e Libras), com Árvore de Decisão experimental e chat com Ollama Local.

Esta versão segue a mesma arquitetura do projeto **Radar Urbano**: backend FastAPI como pacote
(`backend.main:app`), análises em Pandas, frontend separado em `pages/`, `js/` e `static/`,
script único de inicialização e testes automatizados.

## Arquitetura

```text
Navegador (porta 5501)
   ├── Dashboard ───────────┐
   ├── Resumo de dados ─────┤
   ├── Omni IA (chat) ──────┤  HTTP / JSON
   └── Modelo de IA ────────┤
                            ▼
                  API FastAPI (porta 8001)
          ┌─────────────┼──────────────┬───────────────┐
     Pandas/análise  Árvore de     Ollama Local     SQLite
          │          Decisão       (opcional)    (usuários e
          ▼          (sklearn)                   formatos)
 database/omni_dataset_10000_corrigido.csv
```

No chat, **o Python calcula** o resultado direto no CSV; o Ollama recebe apenas esse resultado
e escreve uma explicação. Se o Ollama estiver desligado, o cálculo continua sendo exibido.

## Estrutura de pastas

```text
IA/
├── backend/
│   ├── controller/           # Rotas da API (resumo, dashboard, chat, modelo, usuario, formato_idioma)
│   ├── analise.py            # Leitura, validação e agregações do CSV
│   ├── modelo_ia.py          # Árvore de Decisão (treino, carga e previsão)
│   ├── ollama_local.py       # Cliente do Ollama Local (sem dependência extra)
│   ├── database.py, models.py, schemas.py   # SQLite (cadastros)
│   ├── treinar_modelo.py     # Treino manual do modelo
│   ├── main.py               # Aplicação FastAPI
│   └── requirements.txt
├── database/omni_dataset_10000_corrigido.csv
├── frontend/
│   ├── pages/                # dashboard, resumo, chat, modelo
│   ├── js/                   # api.js (comunicação) + um script por página
│   └── static/               # style.css e logo.png
├── modelo/                   # modelo_arvore.joblib (gerado automaticamente)
├── tests/                    # Pytest
└── iniciar_linux.sh
```

## Execução rápida (Linux Mint)

Na pasta raiz `IA/`:

```bash
chmod +x iniciar_linux.sh
./iniciar_linux.sh
```

Na primeira execução o script cria o `.venv`, instala as dependências e treina o modelo.
Depois, abre a API e o site. Mantenha o terminal aberto; `Ctrl+C` encerra tudo.

| Página | Endereço |
|---|---|
| Dashboard | http://127.0.0.1:5501/pages/dashboard.html |
| Resumo de dados | http://127.0.0.1:5501/pages/resumo.html |
| Omni IA (chat) | http://127.0.0.1:5501/pages/chat.html |
| Modelo de IA | http://127.0.0.1:5501/pages/modelo.html |
| Documentação da API | http://127.0.0.1:8001/docs |

As portas **8001/5501** foram escolhidas para não conflitar com o Radar Urbano (8000/5500);
os dois projetos podem rodar ao mesmo tempo.

## Execução manual (dois terminais)

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r backend/requirements.txt

# Terminal 1 — API (sempre a partir da pasta raiz IA/)
python3 -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001

# Terminal 2 — site
cd frontend
python3 -m http.server 5501 --bind 127.0.0.1
```

> Importante: não execute `uvicorn main:app` de dentro de `backend/`. O backend agora é um
> pacote Python e deve ser iniciado da raiz com `backend.main:app`.

## Ollama Local (opcional)

```bash
ollama pull gemma3:1b
```

Modelo padrão: `gemma3:1b`. Para usar outro: `OLLAMA_MODEL=llama3.2 ./iniciar_linux.sh`.
Também é possível alterar `OLLAMA_URL`, `OLLAMA_TIMEOUT` e `OLLAMA_NUM_GPU`.

## Endpoints

| Método | Endpoint | Finalidade |
|---|---|---|
| GET | `/health` | Verificação de saúde |
| GET | `/analise/resumo` | Indicadores gerais + qualidade dos dados |
| GET | `/analise/direcoes` · `/tipos` · `/modalidades` · `/usuarios` · `/sessoes` | Agregações por categoria |
| GET | `/analise/erros` | Erros por código e mensagem |
| GET | `/dashboard/status` | Distribuição por status |
| GET | `/dashboard/solicitacoes-por-dia` | Série diária |
| POST | `/chat` | Pergunta livre: `{"pergunta": "..."}` |
| GET | `/chat/perguntas` · `/chat/status-ollama` | Sugestões e estado do Ollama |
| GET | `/modelo/info` | Acurácia, classes e valores aceitos |
| POST | `/modelo/prever` | Previsão do status a partir de 8 características |
| POST | `/modelo/treinar` | Treina o modelo novamente |
| GET/POST | `/usuarios/` · `/formatos-idioma/` | Cadastros em SQLite |

## Testes

```bash
source .venv/bin/activate
python3 -m pytest -q
```

## Interpretação e limites

- A base possui **10.000 registros simulados** (58 colunas), de 01/09/2026 a 22/09/2026.
- Campos vazios esperados por regra de negócio: `finalizada_em` (status "processando"),
  `codigo_erro`/`mensagem_erro` (só existem quando há erro) e `confianca_media_movimentos`
  (quando não há movimentos). Por isso o painel separa "campos essenciais vazios" (0) de
  "valores vazios (total)".
- A Árvore de Decisão atinge cerca de **41% de acurácia** em teste, contra **31,5%** da
  referência (prever sempre a classe mais comum). O ganho é modesto porque os dados são
  sintéticos; trate o modelo como recurso didático, não como ferramenta de decisão.
