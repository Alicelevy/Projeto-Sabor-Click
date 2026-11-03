
from flask import Blueprint, jsonify, request
from app.models.pedido import Pedido

pedido_controller = Blueprint("pedido", __name__)

pedidos = []


@pedido_controller.route("/pedidos", methods=["GET"])
def listar_pedidos():
    return jsonify([pedido.to_dict() for pedido in pedidos])


@pedido_controller.route("/pedidos", methods=["POST"])
def criar_pedido():
    dados = request.get_json(silent=True)

    if not dados:
        return jsonify({"erro": "Envie os dados do pedido em JSON."}), 400

    cliente = dados.get("cliente")
    itens = dados.get("itens", [])

    if not cliente or not isinstance(itens, list) or not itens:
        return jsonify({
            "erro": "Informe o cliente e pelo menos um item."
        }), 400

    try:

        total = 0

        for item in itens:
            preco = float(item["preco"])
            quantidade = int(item["quantidade"])

            if preco < 0 or quantidade <= 0:
                raise ValueError()

            total += preco * quantidade

    except (KeyError, TypeError, ValueError):
        return jsonify({
            "erro": "Os itens devem conter preço e quantidade válidos."
        }), 400

    novo_id = max((pedido.id for pedido in pedidos), default=0) + 1

    pedido = Pedido(
        novo_id,
        cliente,
        itens,
        round(total, 2),
        "recebido"
    )

    pedidos.append(pedido)

    return jsonify(pedido.to_dict()), 201


@pedido_controller.route("/pedidos/<int:id>/status", methods=["PUT"])
def atualizar_status(id):
    dados = request.get_json(silent=True)

    if not dados or dados.get("status") not in [
        "recebido", "preparo", "pronto", "entregue"
    ]:
        return jsonify({"erro": "Status inválido."}), 400

    pedido = next(
        (p for p in pedidos if p.id == id),
        None
    )

    if pedido is None:
        return jsonify({"erro": "Pedido não encontrado."}), 404

    pedido.status = dados["status"]

    return jsonify(pedido.to_dict()), 200

