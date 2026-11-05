class Prato:

    def __init__(self, id, nome, preco, descricao, categoria, ativo=True):
        self.id = id
        self.nome = nome
        self.preco = preco
        self.descricao = descricao
        self.categoria = categoria
        self.ativo = ativo

    def atualizar(self, dados):
        self.nome = dados["nome"]
        self.preco = dados["preco"]
        self.descricao = dados["descricao"]
        self.categoria = dados["categoria"]
        self.ativo = dados["ativo"]

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "preco": self.preco,
            "descricao": self.descricao,
            "categoria": self.categoria,
            "ativo": self.ativo
        }
