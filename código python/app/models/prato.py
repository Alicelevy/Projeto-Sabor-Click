class Prato:

    def __init__(self, id, nome, preco, descricao, categoria):
        self.id = id
        self.nome = nome
        self.preco = preco
        self.descricao = descricao
        self.categoria = categoria

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "preco": self.preco,
            "descricao": self.descricao,
            "categoria": self.categoria
        }