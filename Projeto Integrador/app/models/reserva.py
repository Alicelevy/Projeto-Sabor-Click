STATUS_RESERVA = ["pendente", "confirmada", "cancelada"]

BANCADAS = ["A1", "A2", "B1", "B2"]


class Reserva:

    def __init__(self, id, cliente, data, horario, bancada, status="pendente"):
        self.id = id
        self.cliente = cliente
        self.data = data
        self.horario = horario
        self.bancada = bancada
        self.status = status

    def conflita_com(self, data, horario, bancada):
        return (
            self.status != "cancelada"
            and self.data == data
            and self.horario == horario
            and self.bancada == bancada
        )

    def to_dict(self):
        return {
            "id": self.id,
            "cliente": self.cliente,
            "data": self.data,
            "horario": self.horario,
            "bancada": self.bancada,
            "status": self.status
        }
