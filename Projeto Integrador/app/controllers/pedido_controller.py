from flask import Blueprint, flash, g, jsonify, request

from app.controllers.prato_controller import buscar_prato
from app.middlewares import perfil_requerido
from app.models.pedido import STATUS_PEDIDO, Pedido

pedido_controller = Blueprint("pedido", __name__)

pedidos = []


def buscar_pedido(id):
    return next(
        (pedido for pedido in pedidos if pedido.id == id),
        None
    )


def montar_itens(itens_recebidos):
    """Confere cada item no cardápio e usa o preço cadastrado no servidor."""

    if not isinstance(itens_recebidos, list) or not itens_recebidos:
        raise ValueError("Adicione pelo menos um item ao pedido.")

    itens = []

    for item in itens_recebidos:
        try:
            prato_id = int(item["prato_id"])
            quantidade = int(item["quantidade"])
        except (KeyError, TypeError, ValueError):
            raise ValueError("Os itens devem conter prato e quantidade válidos.")

        if quantidade <= 0:
            raise ValueError("A quantidade de cada item deve ser maior que zero.")

        prato = buscar_prato(prato_id)

        if prato is None or not prato.ativo:
            raise LookupError(
                "Um dos pratos do carrinho não está mais disponível. "
                "Atualize o cardápio e tente novamente."
            )

        itens.append({
            "prato_id": prato.id,
            "nome": prato.nome,
            "preco": prato.preco,
            "quantidade": quantidade
        })

    return itens


@pedido_controller.route("/pedidos", methods=["GET"])
@perfil_requerido()
def listar_pedidos():
    visiveis = (
        [pedido for pedido in pedidos if pedido.cliente_id == g.usuario.id]
        if g.usuario.perfil == "cliente"
        else pedidos
    )

    return jsonify([pedido.to_dict() for pedido in reversed(visiveis)])


@pedido_controller.route("/pedidos", methods=["POST"])
@perfil_requerido("cliente")
def criar_pedido():
    dados = request.get_json(silent=True) or {}

    try:
        itens = montar_itens(dados.get("itens"))
    except ValueError as erro:
        return jsonify({"erro": str(erro)}), 400
    except LookupError as erro:
        return jsonify({"erro": str(erro)}), 409

    total = round(
        sum(item["preco"] * item["quantidade"] for item in itens),
        2
    )

    novo_id = max((pedido.id for pedido in pedidos), default=0) + 1

    pedido = Pedido(
        novo_id,
        g.usuario.id,
        g.usuario.nome,
        itens,
        total
    )

    pedidos.append(pedido)
    flash(f"Pedido #{pedido.id} realizado com sucesso! 🎉", "success")

    return jsonify(pedido.to_dict()), 201


@pedido_controller.route("/pedidos/<int:id>/status", methods=["PUT"])
@perfil_requerido("cozinheiro", "administrador")
def atualizar_status(id):
    dados = request.get_json(silent=True) or {}

    if dados.get("status") not in STATUS_PEDIDO:
        return jsonify({"erro": "Status inválido."}), 400

    pedido = buscar_pedido(id)

    if pedido is None:
        return jsonify({"erro": "Pedido não encontrado."}), 404

    pedido.status = dados["status"]
    flash(f"Pedido #{id} atualizado.", "success")

    return jsonify(pedido.to_dict()), 200


@pedido_controller.route("/pedidos/<int:id>/tempo", methods=["PUT"])
@perfil_requerido("cozinheiro", "administrador")
def definir_tempo_estimado(id):
    dados = request.get_json(silent=True) or {}

    try:
        minutos = int(dados.get("tempo_estimado"))
    except (TypeError, ValueError):
        minutos = 0

    if not 1 <= minutos <= 240:
        return jsonify({
            "erro": "Informe um tempo entre 1 e 240 minutos."
        }), 400

    pedido = buscar_pedido(id)

    if pedido is None:
        return jsonify({"erro": "Pedido não encontrado."}), 404

    pedido.tempo_estimado = minutos
    flash(f"Tempo do pedido #{id} definido em {minutos} min.", "success")

    return jsonify(pedido.to_dict()), 200
