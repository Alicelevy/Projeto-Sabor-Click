STATUS_RESERVA = ["pendente", "confirmado", "cancelado"]

class Reserva:

    def __init__(
        self,
        id,
        cliente,
        data_inicio,
        data_fim,
        bancada,
        bancada_id,
        status="pendente"
    ):
        self.id = id
        self.cliente = cliente
        self.data_inicio = data_inicio
        self.data_fim = data_fim
        self.bancada = bancada
        self.bancada_id = bancada_id
        self.status = status

    @property
    def data(self):
        return self.data_inicio.strftime("%Y-%m-%d")

    @property
    def horario(self):
        return self.data_inicio.strftime("%H:%M")

    @property
    def dataFormatada(self):
        return self.data_inicio.strftime("%d/%m/%Y")

    def to_dict(self):
        return {
            "id": self.id,
            "cliente": self.cliente,
            "data": self.data,
            "dataFormatada": self.dataFormatada,
            "horario": self.horario,
            "bancada": self.bancada,
            "bancada_id": self.bancada_id,
            "status": self.status
        }
