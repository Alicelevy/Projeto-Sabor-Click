from flask import Blueprint, flash, jsonify, request

from app.middlewares import perfil_requerido
from app.models.estoque import ItemEstoque

estoque_controller = Blueprint("estoque", __name__)

UNIDADES = ["kg", "g", "l", "ml", "un"]

estoque = [
    ItemEstoque(1, "Carne", 50, "kg", 10),
    ItemEstoque(2, "Pão", 100, "un", 20),
    ItemEstoque(3, "Queijo", 30, "kg", 5),
    ItemEstoque(4, "Macarrão", 40, "kg", 10),
    ItemEstoque(5, "Batata", 8, "kg", 15)
]


def buscar_item(id):
    return next(
        (item for item in estoque if item.id == id),
        None
    )


@estoque_controller.route("/estoque", methods=["GET"])
@perfil_requerido("administrador")
def listar_estoque():
    return jsonify([item.to_dict() for item in estoque])


@estoque_controller.route("/estoque", methods=["POST"])
@perfil_requerido("administrador")
def criar_item():
    dados = request.get_json(silent=True) or {}
    nome = str(dados.get("nome", "")).strip()
    unidade = dados.get("unidade")

    try:
        quantidade = int(dados.get("quantidade"))
        minimo = int(dados.get("minimo"))
    except (TypeError, ValueError):
        return jsonify({"erro": "Quantidade e mínimo devem ser números inteiros."}), 400

    if not nome or unidade not in UNIDADES or quantidade < 0 or minimo < 0:
        return jsonify({
            "erro": "Informe nome, unidade e valores maiores ou iguais a zero."
        }), 400

    novo_id = max((item.id for item in estoque), default=0) + 1
    item = ItemEstoque(novo_id, nome, quantidade, unidade, minimo)

    estoque.append(item)
    flash(f"{item.nome} adicionado ao estoque.", "success")

    return jsonify(item.to_dict()), 201


@estoque_controller.route("/estoque/<int:id>", methods=["PUT"])
@perfil_requerido("administrador")
def ajustar_item(id):
    dados = request.get_json(silent=True) or {}

    try:
        ajuste = int(dados.get("ajuste"))
    except (TypeError, ValueError):
        ajuste = 0

    if ajuste == 0:
        return jsonify({"erro": "Informe uma quantidade diferente de zero."}), 400

    item = buscar_item(id)

    if item is None:
        return jsonify({"erro": "Ingrediente não encontrado."}), 404

    try:
        item.ajustar(ajuste)
    except ValueError as erro:
        return jsonify({"erro": str(erro)}), 400

    movimento = "Entrada" if ajuste > 0 else "Saída"
    flash(f"{movimento} de {abs(ajuste)} {item.unidade} de {item.nome}.", "success")

    return jsonify(item.to_dict()), 200


@estoque_controller.route("/estoque/<int:id>", methods=["DELETE"])
@perfil_requerido("administrador")
def remover_item(id):
    item = buscar_item(id)

    if item is None:
        return jsonify({"erro": "Ingrediente não encontrado."}), 404

    estoque.remove(item)
    flash(f"{item.nome} removido do estoque.", "info")

    return jsonify({"id": id}), 200
