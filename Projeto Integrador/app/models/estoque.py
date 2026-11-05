class ItemEstoque:

    def __init__(self, id, nome, quantidade, unidade, minimo):
        self.id = id
        self.nome = nome
        self.quantidade = quantidade
        self.unidade = unidade
        self.minimo = minimo

    def ajustar(self, quantidade):
        if self.quantidade + quantidade < 0:
            raise ValueError("Quantidade insuficiente em estoque.")

        self.quantidade += quantidade

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "quantidade": self.quantidade,
            "unidade": self.unidade,
            "minimo": self.minimo,
            "critico": self.quantidade < self.minimo
        }
