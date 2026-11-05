from datetime import date, time

from flask import Blueprint, flash, jsonify, request

from app.middlewares import perfil_requerido
from app.models.reserva import BANCADAS, STATUS_RESERVA, Reserva

reserva_controller = Blueprint("reserva", __name__)

reservas = [
    Reserva(1, "Ana Costa", "2026-11-10", "10:00", "A1", "confirmada"),
    Reserva(2, "Carlos Lima", "2026-11-10", "14:00", "B2")
]


def buscar_reserva(id):
    return next(
        (reserva for reserva in reservas if reserva.id == id),
        None
    )


def validar_reserva(dados):
    cliente = str(dados.get("cliente", "")).strip()
    bancada = dados.get("bancada")

    if not cliente:
        raise ValueError("Informe o nome do cliente.")

    if bancada not in BANCADAS:
        raise ValueError("Escolha uma bancada válida.")

    try:
        data = date.fromisoformat(dados.get("data", "")).isoformat()
        horario = time.fromisoformat(dados.get("horario", "")).strftime("%H:%M")
    except (TypeError, ValueError):
        raise ValueError("Informe data e horário válidos.")

    return cliente, data, horario, bancada


@reserva_controller.route("/reservas", methods=["GET"])
@perfil_requerido("administrador")
def listar_reservas():
    return jsonify([reserva.to_dict() for reserva in reservas])


@reserva_controller.route("/reservas", methods=["POST"])
@perfil_requerido("administrador")
def criar_reserva():
    try:
        cliente, data, horario, bancada = validar_reserva(
            request.get_json(silent=True) or {}
        )
    except ValueError as erro:
        return jsonify({"erro": str(erro)}), 400

    if any(r.conflita_com(data, horario, bancada) for r in reservas):
        return jsonify({
            "erro": f"A bancada {bancada} já está reservada nesse horário."
        }), 409

    novo_id = max((reserva.id for reserva in reservas), default=0) + 1
    reserva = Reserva(novo_id, cliente, data, horario, bancada)

    reservas.append(reserva)
    flash(f"Reserva da bancada {bancada} criada.", "success")

    return jsonify(reserva.to_dict()), 201


@reserva_controller.route("/reservas/<int:id>/status", methods=["PUT"])
@perfil_requerido("administrador")
def atualizar_status_reserva(id):
    dados = request.get_json(silent=True) or {}

    if dados.get("status") not in STATUS_RESERVA:
        return jsonify({"erro": "Status inválido."}), 400

    reserva = buscar_reserva(id)

    if reserva is None:
        return jsonify({"erro": "Reserva não encontrada."}), 404

    reserva.status = dados["status"]
    flash(f"Reserva #{id} marcada como {reserva.status}.", "success")

    return jsonify(reserva.to_dict()), 200


@reserva_controller.route("/reservas/<int:id>", methods=["DELETE"])
@perfil_requerido("administrador")
def remover_reserva(id):
    reserva = buscar_reserva(id)

    if reserva is None:
        return jsonify({"erro": "Reserva não encontrada."}), 404

    reservas.remove(reserva)
    flash(f"Reserva #{id} excluída.", "info")

    return jsonify({"id": id}), 200
