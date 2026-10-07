from fastapi import FastAPI, HTTPException
import pandas as pd

from analise import ler_dados, resumo, por_direcao, por_data

app = FastAPI(title='Ciência de Dados com CSV - Acessibilidade')


def carregar_dados():
    try:
        return ler_dados()
    except (OSError, UnicodeError) as erro:
        raise HTTPException(
            status_code=503,
            detail='Não foi possível abrir database/omni_dataset_10000_variado.csv.',
        ) from erro
    except (ValueError, pd.errors.ParserError) as erro:
        raise HTTPException(
            status_code=422,
            detail='Confira o cabeçalho, as datas e os números do CSV.',
        ) from erro


@app.get('/')
def inicio():
    return {'mensagem': 'Backend de Ciência de Dados funcionando'}


@app.get('/analise/resumo')
def consultar_resumo():
    dados = carregar_dados()
    return resumo(dados)


@app.get('/analise/direcoes')
def consultar_direcoes():
    dados = carregar_dados()
    return por_direcao(dados)


@app.get('/analise/datas')
def consultar_datas():
    dados = carregar_dados()
    return por_data(dados)
