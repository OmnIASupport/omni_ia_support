"""Árvore de Decisão experimental que estima o status de uma solicitação de tradução.

O modelo é treinado com o próprio CSV. Se o arquivo .joblib não existir ou tiver sido
salvo por outra versão do scikit-learn, ele é treinado novamente de forma automática.
"""
from __future__ import annotations

import warnings
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeClassifier

from .analise import ler_dados

CAMINHO_MODELO = Path(__file__).resolve().parent.parent / "modelo" / "modelo_arvore.joblib"

FEATURES = [
    "usa_libras",
    "tipo_entrada",
    "direcao_traducao",
    "tipo_processamento",
    "formato_origem_tipo",
    "formato_destino_tipo",
    "status_usuario",
    "status_sessao_comunicacao",
]
TARGET = "status_solicitacao_traducao"

_estado: dict = {"pacote": None}


def _criar_pipeline() -> Pipeline:
    preprocessamento = ColumnTransformer([
        ("categorias", Pipeline([
            ("preencher", SimpleImputer(strategy="most_frequent")),
            ("codificar", OneHotEncoder(handle_unknown="ignore")),
        ]), FEATURES),
    ])
    return Pipeline([
        ("preprocessamento", preprocessamento),
        ("arvore", DecisionTreeClassifier(max_depth=8, random_state=42, class_weight="balanced")),
    ])


def treinar(salvar: bool = True) -> dict:
    df = ler_dados()
    X = df[FEATURES].astype(str)
    y = df[TARGET].astype(str)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    teste = _criar_pipeline().fit(X_tr, y_tr)
    acuracia = round(float(accuracy_score(y_te, teste.predict(X_te))) * 100, 2)
    referencia = round(float(y_te.value_counts(normalize=True).max()) * 100, 2)

    final = _criar_pipeline().fit(X, y)
    pacote = {
        "modelo": final,
        "acuracia_teste_percentual": acuracia,
        "acuracia_referencia_percentual": referencia,
        "registros_treino": int(len(X)),
        "classes": sorted(y.unique().tolist()),
        "valores_validos": {c: sorted(X[c].unique().tolist()) for c in FEATURES},
    }
    if salvar:
        CAMINHO_MODELO.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(pacote, CAMINHO_MODELO)
    _estado["pacote"] = pacote
    return pacote


def carregar() -> dict:
    if _estado["pacote"] is not None:
        return _estado["pacote"]
    if CAMINHO_MODELO.exists():
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                pacote = joblib.load(CAMINHO_MODELO)
            if isinstance(pacote, dict) and "modelo" in pacote:
                _estado["pacote"] = pacote
                return pacote
        except Exception:
            pass  # versão incompatível ou arquivo corrompido: treina novamente
    return treinar()


def info() -> dict:
    pacote = carregar()
    return {
        "algoritmo": "Árvore de Decisão (scikit-learn)",
        "alvo": TARGET,
        "variaveis_entrada": FEATURES,
        "classes": pacote["classes"],
        "acuracia_teste_percentual": pacote["acuracia_teste_percentual"],
        "acuracia_referencia_percentual": pacote["acuracia_referencia_percentual"],
        "registros_treino": pacote["registros_treino"],
        "valores_validos": pacote["valores_validos"],
        "observacao": (
            "Modelo experimental treinado com dados simulados. A acurácia de referência "
            "corresponde a sempre prever a classe mais comum; use-a para comparar."
        ),
    }


def prever(entrada: dict) -> dict:
    pacote = carregar()
    invalidos = {
        c: entrada.get(c) for c in FEATURES
        if str(entrada.get(c)) not in pacote["valores_validos"][c]
    }
    if invalidos:
        raise ValueError(
            "Valores não reconhecidos: "
            + ", ".join(f"{c}={v!r}" for c, v in invalidos.items())
        )
    linha = pd.DataFrame([{c: str(entrada[c]) for c in FEATURES}])
    modelo = pacote["modelo"]
    probabilidades = modelo.predict_proba(linha)[0]
    classes = [str(c) for c in modelo.classes_]
    ranking = sorted(zip(classes, probabilidades), key=lambda x: x[1], reverse=True)
    return {
        "previsao": ranking[0][0],
        "probabilidades": [{"status": c, "probabilidade": round(float(p), 4)} for c, p in ranking],
        "acuracia_teste_percentual": pacote["acuracia_teste_percentual"],
    }
