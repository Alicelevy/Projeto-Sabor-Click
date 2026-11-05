from datetime import datetime


STATUS_PEDIDO = ["recebido", "preparo", "pronto", "entregue"]


class Pedido:

    def __init__(self, id, cliente_id, cliente, itens, total):
        self.id = id
        self.cliente_id = cliente_id
        self.cliente = cliente
        self.itens = itens
        self.total = total
        self.status = "recebido"
        self.data_hora = datetime.now().isoformat(timespec="seconds")
        self.tempo_estimado = None

    def to_dict(self):
        return {
            "id": self.id,
            "cliente_id": self.cliente_id,
            "cliente": self.cliente,
            "itens": self.itens,
            "total": self.total,
            "status": self.status,
            "data_hora": self.data_hora,
            "tempo_estimado": self.tempo_estimado
        }
