
from datetime import datetime


STATUS_PEDIDO = [
    "Aguardando",
    "Em Preparo",
    "Iniciando Preparo",
    "Pronto para Entrega",
    "Entregue",
    "Cancelado"
]


class Pedido:

    def __init__(
        self,
        id,
        cliente_id,
        cliente,
        itens,
        total,
        status="Aguardando",
        data_hora=None,
        tempo_estimado=None
    ):
        self.id = id
        self.cliente_id = cliente_id
        self.cliente = cliente
        self.itens = itens
        self.total = float(total)
        self.status = status
        self.data_hora = (
            data_hora.isoformat(timespec="seconds")
            if isinstance(data_hora, datetime)
            else data_hora
        )
        self.tempo_estimado = tempo_estimado

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
