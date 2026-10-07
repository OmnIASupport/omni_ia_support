from pathlib import Path

import pandas as pd

CAMINHO_CSV = (
    Path(__file__).resolve().parent / 'database' / 'omni_dataset_10000_variado.csv'
)

STATUS_VALIDOS = {'concluida', 'erro', 'cancelada', 'processando'}


def ler_dados():
    # Cada linha é uma solicitação de tradução. Neste CSV, cada solicitação
    # tem uma mensagem e uma sessão próprias (1 linha = 1 solicitação).
    df = pd.read_csv(CAMINHO_CSV)
    # O CSV tem 58 colunas; a análise usa apenas estas.
    colunas = [
        'id_solicitacao_traducao', 'id_sessao', 'id_usuario',
        'direcao_traducao', 'tipo_processamento',
        'status_solicitacao_traducao',
        'solicitada_em', 'iniciada_em', 'finalizada_em',
        'tempo_processamento_ms', 'qtd_etapas', 'confianca_media_etapas',
    ]
    if not set(colunas).issubset(df.columns):
        raise ValueError('Confira as colunas do CSV.')
    df = df[colunas].copy()
    # codigo_erro e mensagem_erro ficam fora: estão vazios em muitas linhas
    # (ausência esperada) e não dependem do status da solicitação.
    if df.empty or df.isna().any().any():
        raise ValueError('O CSV está vazio ou contém campos ausentes.')

    for coluna in ['solicitada_em', 'iniciada_em', 'finalizada_em']:
        df[coluna] = pd.to_datetime(
            df[coluna], format='%Y-%m-%d %H:%M:%S', errors='raise'
        )
    numeros = [
        'id_solicitacao_traducao', 'id_sessao', 'id_usuario',
        'tempo_processamento_ms', 'qtd_etapas', 'confianca_media_etapas',
    ]
    for coluna in numeros:
        df[coluna] = pd.to_numeric(df[coluna], errors='raise')
    if df[numeros].isin([float('inf'), -float('inf')]).any().any():
        raise ValueError('O CSV contém valores infinitos.')

    for coluna in ['id_solicitacao_traducao', 'id_sessao', 'id_usuario',
                   'tempo_processamento_ms', 'qtd_etapas']:
        if (df[coluna] % 1 != 0).any():
            raise ValueError('IDs, tempos e quantidades devem ser inteiros.')
    if (df[['id_solicitacao_traducao', 'id_sessao', 'id_usuario']] <= 0).any().any():
        raise ValueError('Os identificadores devem ser positivos.')
    if (df['tempo_processamento_ms'] < 0).any() or (df['qtd_etapas'] < 1).any():
        raise ValueError('Tempo não pode ser negativo e deve haver ao menos uma etapa.')
    if not df['confianca_media_etapas'].between(0, 1).all():
        raise ValueError('Confiança deve estar entre 0 e 1.')
    if not df['status_solicitacao_traducao'].isin(STATUS_VALIDOS).all():
        raise ValueError('Há status de solicitação desconhecido.')

    if df['id_solicitacao_traducao'].duplicated().any():
        raise ValueError('Há solicitações repetidas. Verifique a fonte antes de analisar.')
    if df.duplicated().any():
        raise ValueError('Há linhas idênticas. Verifique a fonte antes de analisar.')

    # A ordem dos horários deve fazer sentido e o tempo registrado deve
    # corresponder à diferença entre início e fim (margem de 1 s, pois os
    # horários não têm milissegundos).
    if (df['iniciada_em'] < df['solicitada_em']).any() or (
        df['finalizada_em'] < df['iniciada_em']
    ).any():
        raise ValueError('Há horários fora de ordem (solicitada, iniciada, finalizada).')
    duracao_ms = (df['finalizada_em'] - df['iniciada_em']).dt.total_seconds() * 1000
    if ((df['tempo_processamento_ms'] - duracao_ms).abs() > 1000).any():
        raise ValueError('tempo_processamento_ms não confere com início e fim.')

    # Indicadores auxiliares usados nos agrupamentos.
    df['concluida'] = (df['status_solicitacao_traducao'] == 'concluida').astype(int)
    df['com_erro'] = (df['status_solicitacao_traducao'] == 'erro').astype(int)
    df['data'] = df['solicitada_em'].dt.strftime('%Y-%m-%d')
    return df


def resumo(df):
    total = len(df)
    por_status = {}
    for status, qtd in df['status_solicitacao_traducao'].value_counts().items():
        por_status[status] = {
            'solicitacoes': int(qtd),
            'percentual': round(float(qtd) / total * 100, 2),
        }
    return {
        'solicitacoes': int(total),
        'sessoes': int(df['id_sessao'].nunique()),
        'usuarios': int(df['id_usuario'].nunique()),
        'tempo_medio_ms': round(float(df['tempo_processamento_ms'].mean()), 2),
        'tempo_mediano_ms': round(float(df['tempo_processamento_ms'].median()), 2),
        'confianca_media': round(float(df['confianca_media_etapas'].mean()), 4),
        'por_status': por_status,
        'data_inicial': df['solicitada_em'].min().strftime('%Y-%m-%d'),
        'data_final': df['solicitada_em'].max().strftime('%Y-%m-%d'),
    }


def por_direcao(df):
    tabela = df.groupby('direcao_traducao', as_index=False).agg(
        solicitacoes=('id_solicitacao_traducao', 'count'),
        tempo_medio_ms=('tempo_processamento_ms', 'mean'),
        confianca_media=('confianca_media_etapas', 'mean'),
        concluidas=('concluida', 'sum'),
        com_erro=('com_erro', 'sum'),
    )
    tabela['percentual_concluidas'] = (
        tabela['concluidas'] / tabela['solicitacoes'] * 100
    ).round(2)
    tabela['percentual_erro'] = (
        tabela['com_erro'] / tabela['solicitacoes'] * 100
    ).round(2)
    tabela['tempo_medio_ms'] = tabela['tempo_medio_ms'].round(2)
    tabela['confianca_media'] = tabela['confianca_media'].round(4)
    tabela = tabela.sort_values('solicitacoes', ascending=False)
    return tabela.to_dict(orient='records')


def por_data(df):
    tabela = df.groupby('data', as_index=False).agg(
        solicitacoes=('id_solicitacao_traducao', 'count'),
        tempo_medio_ms=('tempo_processamento_ms', 'mean'),
        concluidas=('concluida', 'sum'),
    )
    tabela['tempo_medio_ms'] = tabela['tempo_medio_ms'].round(2)
    return tabela.to_dict(orient='records')


if __name__ == '__main__':
    dados = ler_dados()
    print('Primeiras cinco solicitações:')
    print(dados.head())
    print('Resumo:')
    print(resumo(dados))
