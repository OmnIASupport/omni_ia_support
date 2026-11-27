"""Treina a Árvore de Decisão manualmente. Execute na raiz: python3 -m backend.treinar_modelo"""
from .modelo_ia import CAMINHO_MODELO, treinar

if __name__ == "__main__":
    pacote = treinar()
    print("Acurácia no conjunto de teste:", pacote["acuracia_teste_percentual"], "%")
    print("Acurácia de referência (classe mais comum):", pacote["acuracia_referencia_percentual"], "%")
    print("Modelo salvo em:", CAMINHO_MODELO)
