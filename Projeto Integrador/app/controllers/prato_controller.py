from flask import Blueprint, jsonify

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


@prato_controller.route("/pratos", methods=["GET"])
def listar_pratos():

    return jsonify([
        prato.to_dict()
        for prato in pratos
    ])