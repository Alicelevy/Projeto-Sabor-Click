from flask import Blueprint, flash, jsonify, request, session

from app.models.usuario import Usuario


usuario_controller = Blueprint(
    "usuario",
    __name__
)


usuarios = [

    Usuario(
        1,
        "Alice Levy",
        "admin@saborclic.com",
        "admin123",
        "administrador"
    ),

    Usuario(
        2,
        "Ana Costa",
        "cliente@saborclic.com",
        "cliente123",
        "cliente"
    ),

    Usuario(
        3,
        "Heitor Borges",
        "cozinha@saborclic.com",
        "cozinha123",
        "cozinheiro"
    )
]


def buscar_usuario(id):
    return next(
        (usuario for usuario in usuarios if usuario.id == id),
        None
    )


@usuario_controller.route("/login", methods=["POST"])
def login():
    dados = request.get_json(silent=True) or {}

    email = str(dados.get("email", "")).strip().lower()
    senha = str(dados.get("senha", ""))

    if not email or not senha:
        return jsonify({"erro": "Informe email e senha."}), 400

    usuario = next(
        (u for u in usuarios if u.email == email),
        None
    )

    if usuario is None or not usuario.confere_senha(senha):
        return jsonify({"erro": "Email ou senha incorretos."}), 401

    session["usuario_id"] = usuario.id
    flash(f"Bem-vindo(a), {usuario.nome}!", "success")

    return jsonify({"usuario": usuario.to_dict()}), 200


@usuario_controller.route("/logout", methods=["POST"])
def logout():
    session.clear()
    flash("Você saiu do sistema. Até logo! 👋", "info")

    return jsonify({}), 200


@usuario_controller.route("/usuario-atual", methods=["GET"])
def usuario_atual():
    usuario = buscar_usuario(session.get("usuario_id"))

    return jsonify({
        "usuario": usuario.to_dict() if usuario else None
    }), 200
