class Pedido:

    def __init__(self, id, cliente, itens, total, status):
        self.id = id
        self.cliente = cliente
        self.itens = itens
        self.total = total
        self.status = status

    def to_dict(self):
        return {
            "id": self.id,
            "cliente": self.cliente,
            "itens": self.itens,
            "total": self.total,
            "status": self.status
        }