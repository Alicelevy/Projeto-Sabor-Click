
from decimal import Decimal


class ItemEstoque:

    def __init__(self, id, nome, quantidade, unidade, minimo):
        self.id = id
        self.nome = nome
        self.quantidade = Decimal(str(quantidade))
        self.unidade = unidade
        self.minimo = Decimal(str(minimo))

    def ajustar(self, quantidade):
        ajuste = Decimal(str(quantidade))

        if self.quantidade + ajuste < 0:
            raise ValueError("Quantidade insuficiente em estoque.")

        self.quantidade += ajuste

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "quantidade": float(self.quantidade),
            "unidade": self.unidade,
            "minimo": float(self.minimo),
            "critico": self.quantidade < self.minimo
        }
