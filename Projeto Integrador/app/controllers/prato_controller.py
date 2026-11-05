from flask import Blueprint, flash, g, jsonify, request

from app.middlewares import perfil_requerido
from app.models.prato import Prato


prato_controller = Blueprint(
    "prato",
    __name__
)


pratos = [

    Prato(
        1,
        "Hambúrguer Artesanal",
        25.00,
        "Pão brioche, carne 180g, queijo, alface e tomate",
        "Lanches"
    ),

    Prato(
        2,
        "Macarrão ao Molho",
        22.00,
        "Macarrão com molho bolonhesa e queijo parmesão",
        "Massas"
    ),

    Prato(
        3,
        "Batata Frita",
        12.00,
        "Batata frita crocante com sal e pimenta",
        "Acompanhamentos"
    ),

    Prato(
        4,
        "Salada Caesar",
        18.00,
        "Alface, frango, croutons e molho caesar",
        "Saladas"
    ),

    Prato(
        5,
        "Pizza Margherita",
        32.00,
        "Mussarela, tomate e manjericão",
        "Pizzas"
    ),

    Prato(
        6,
        "Suco Natural",
        8.00,
        "Suco feito com frutas frescas",
        "Bebidas"
    )
]


def buscar_prato(id):
    return next(
        (prato for prato in pratos if prato.id == id),
        None
    )


def validar_prato(dados):
    nome = str(dados.get("nome", "")).strip()
    descricao = str(dados.get("descricao", "")).strip()
    categoria = str(dados.get("categoria", "")).strip()
    ativo = dados.get("ativo", True)

    if not nome or not descricao or not categoria:
        raise ValueError("Informe nome, descrição e categoria do prato.")

    try:
        preco = round(float(dados.get("preco")), 2)
    except (TypeError, ValueError):
        raise ValueError("Informe um preço válido.")

    if not 0 < preco < 10000:
        raise ValueError("O preço deve estar entre R$ 0,01 e R$ 9.999,99.")

    if not isinstance(ativo, bool):
        raise ValueError("O campo ativo deve ser verdadeiro ou falso.")

    return {
        "nome": nome,
        "preco": preco,
        "descricao": descricao,
        "categoria": categoria,
        "ativo": ativo
    }


@prato_controller.route("/pratos", methods=["GET"])
@perfil_requerido()
def listar_pratos():
    visiveis = (
        pratos
        if g.usuario.perfil == "administrador"
        else [prato for prato in pratos if prato.ativo]
    )

    return jsonify([prato.to_dict() for prato in visiveis])


@prato_controller.route("/pratos", methods=["POST"])
@perfil_requerido("administrador")
def criar_prato():
    try:
        campos = validar_prato(request.get_json(silent=True) or {})
    except ValueError as erro:
        return jsonify({"erro": str(erro)}), 400

    novo_id = max((prato.id for prato in pratos), default=0) + 1
    prato = Prato(novo_id, **campos)

    pratos.append(prato)
    flash(f"Prato \"{prato.nome}\" cadastrado.", "success")

    return jsonify(prato.to_dict()), 201


@prato_controller.route("/pratos/<int:id>", methods=["PUT"])
@perfil_requerido("administrador")
def atualizar_prato(id):
    prato = buscar_prato(id)

    if prato is None:
        return jsonify({"erro": "Prato não encontrado."}), 404

    try:
        campos = validar_prato(request.get_json(silent=True) or {})
    except ValueError as erro:
        return jsonify({"erro": str(erro)}), 400

    prato.atualizar(campos)
    flash(f"Prato \"{prato.nome}\" atualizado.", "success")

    return jsonify(prato.to_dict()), 200


@prato_controller.route("/pratos/<int:id>", methods=["DELETE"])
@perfil_requerido("administrador")
def remover_prato(id):
    prato = buscar_prato(id)

    if prato is None:
        return jsonify({"erro": "Prato não encontrado."}), 404

    pratos.remove(prato)
    flash(f"Prato \"{prato.nome}\" removido do cardápio.", "info")

    return jsonify({"id": id}), 200
