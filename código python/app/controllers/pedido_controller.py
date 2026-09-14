from flask import Blueprint, jsonify, request

from app.models.pedido import Pedido


pedido_controller = Blueprint(
    "pedido",
    __name__
)


pedidos = []


@pedido_controller.route("/pedidos", methods=["GET"])
def listar_pedidos():

    return jsonify([
        pedido.to_dict()
        for pedido in pedidos
    ])


@pedido_controller.route("/pedidos", methods=["POST"])
def criar_pedido():

    dados = request.get_json()

    cliente = dados.get("cliente")
    itens = dados.get("itens", [])

    total = 0

    for item in itens:

        preco = float(item["preco"])
        quantidade = int(item["quantidade"])

        total += preco * quantidade

    novo_id = len(pedidos) + 1

    pedido = Pedido(
        novo_id,
        cliente,
        itens,
        total,
        "recebido"
    )

    pedidos.append(pedido)

    return jsonify(pedido.to_dict()), 201