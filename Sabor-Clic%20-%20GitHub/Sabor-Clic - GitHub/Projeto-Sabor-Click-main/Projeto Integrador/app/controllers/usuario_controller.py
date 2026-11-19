
import mysql.connector
from app.criptografia import encrypt, decrypt

from flask import Blueprint, flash, jsonify, request, session
from werkzeug.security import generate_password_hash

from app.conexao import conectar_banco
from app.models.usuario import Usuario


usuario_controller = Blueprint("usuario", __name__)



def buscar_usuario(id):
    """Busca um usuário pelo ID e descriptografa seu endereço."""

    if id is None:
        return None

    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, nome, email, senha, tipo, endereco
            FROM usuarios
            WHERE id = %s
        """, (id,))

        dados = cursor.fetchone()

        if dados is None:
            return None

        endereco = dados["endereco"]

        if endereco:
            endereco = decrypt(endereco)

        return Usuario(
            id=dados["id"],
            nome=dados["nome"],
            email=dados["email"],
            senha=dados["senha"],
            perfil=dados["tipo"],
            endereco=endereco
        )

    finally:
        if cursor:
            cursor.close()

        if conexao and conexao.is_connected():
            conexao.close()


@usuario_controller.route("/cadastro", methods=["POST"])
def cadastrar_cliente():
    dados = request.get_json(silent=True) or {}

    nome = str(dados.get("nome", "")).strip()
    email = str(dados.get("email", "")).strip().lower()
    senha = str(dados.get("senha", ""))
    endereco = str(dados.get("endereco", "")).strip()

    # Validação dos campos
    if not nome or not email or not senha:
        return jsonify({
            "erro": "Preencha nome, email e senha."
        }), 400

    if "@" not in email or "." not in email:
        return jsonify({
            "erro": "Informe um email válido."
        }), 400

    if len(senha) < 8:
        return jsonify({
            "erro": "A senha deve ter pelo menos 8 caracteres."
        }), 400

    endereco_criptografado = encrypt(endereco)

    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        # Verifica se o email já está cadastrado
        cursor.execute("""
            SELECT id FROM usuarios
            WHERE email = %s
        """, (email,))

        if cursor.fetchone():
            return jsonify({
                "erro": "Este email já está cadastrado."
            }), 409

        # Criptografa a senha antes de salvar
        senha_hash = generate_password_hash(senha)

        cursor.execute("""
            INSERT INTO usuarios (nome, email, senha, tipo, endereco)
            VALUES (%s, %s, %s, 'cliente', %s)
        """, (nome, email, senha_hash, endereco_criptografado))

        conexao.commit()

        novo_cliente = {
            "id": cursor.lastrowid,
            "nome": nome,
            "email": email,
            "tipo": "cliente"
        }

        return jsonify({
            "mensagem": "Cadastro realizado com sucesso!",
            "usuario": novo_cliente
        }), 201

    except mysql.connector.IntegrityError:
        if conexao:
            conexao.rollback()

        return jsonify({
            "erro": "Este email já está cadastrado."
        }), 409

    except mysql.connector.Error:
        if conexao:
            conexao.rollback()

        return jsonify({
            "erro": "Não foi possível realizar o cadastro."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conexao and conexao.is_connected():
            conexao.close()


@usuario_controller.route("/login", methods=["POST"])
def login():
    dados = request.get_json(silent=True) or {}

    email = str(dados.get("email", "")).strip().lower()
    senha = str(dados.get("senha", ""))

    if not email or not senha:
        return jsonify({"erro": "Informe email e senha."}), 400

    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, nome, email, senha, tipo
            FROM usuarios
            WHERE email = %s
        """, (email,))

        dados_usuario = cursor.fetchone()

        if dados_usuario is None:
            return jsonify({
                "erro": "Email ou senha incorretos."
            }), 401

        usuario = Usuario(
            id=dados_usuario["id"],
            nome=dados_usuario["nome"],
            email=dados_usuario["email"],
            senha=dados_usuario["senha"],
            perfil=dados_usuario["tipo"]
        )

        if not usuario.confere_senha(senha):
            return jsonify({
                "erro": "Email ou senha incorretos."
            }), 401

        session.clear()
        session["usuario_id"] = usuario.id

        flash(f"Bem-vindo(a), {usuario.nome}!", "success")

        return jsonify({
            "usuario": usuario.to_dict()
        }), 200

    except mysql.connector.Error:
        return jsonify({
            "erro": "Não foi possível acessar o banco de dados."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conexao and conexao.is_connected():
            conexao.close()


@usuario_controller.route("/logout", methods=["POST"])
def logout():
    session.clear()

    flash("Você saiu do sistema. Até logo!", "info")

    return jsonify({}), 200


@usuario_controller.route("/usuario-atual", methods=["GET"])
def usuario_atual():
    try:
        usuario = buscar_usuario(session.get("usuario_id"))

        return jsonify({
            "usuario": usuario.to_dict() if usuario else None
        }), 200

    except mysql.connector.Error:
        return jsonify({
            "erro": "Não foi possível consultar o usuário."
        }), 500


@usuario_controller.route("/clientes", methods=["GET"])
def listar_clientes():
    conexao = None
    cursor = None

    try:
        # A lista contém dados pessoais e é usada somente na gestão administrativa.
        usuario = buscar_usuario(session.get("usuario_id"))
        if usuario is None:
            return jsonify({"erro": "Faça login para continuar."}), 401
        if usuario.perfil != "administrador":
            return jsonify({"erro": "Você não tem permissão para esta ação."}), 403

        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, nome, email
            FROM usuarios
            WHERE tipo = 'cliente'
            ORDER BY nome
        """)

        clientes = cursor.fetchall()

        return jsonify(clientes), 200

    except mysql.connector.Error:
        return jsonify({
            "erro": "Não foi possível consultar os clientes."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conexao and conexao.is_connected():
            conexao.close()
