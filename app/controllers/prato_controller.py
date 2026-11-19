from flask import Blueprint, flash, g, jsonify, request
from mysql.connector import Error, IntegrityError

from app.conexao import conectar_banco
from app.middlewares import perfil_requerido
from app.models.prato import Prato


prato_controller = Blueprint("prato", __name__)


def _prato_da_linha(linha):
    """Converte um registro do MySQL para o modelo Prato."""
    return Prato(
        id=linha["id"],
        nome=linha["nome"],
        preco=float(linha["preco"]),
        descricao=linha["descricao"],
        categoria=linha["categoria"],
        ativo=bool(linha["ativo"])
    )


def buscar_prato(id):
    """Busca um prato pelo ID. Também é utilizada pelo controller de pedidos."""
    conexao = conectar_banco()
    cursor = conexao.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT id, nome, preco, descricao, categoria, ativo
            FROM pratos
            WHERE id = %s
            """,
            (id,)
        )
        linha = cursor.fetchone()
        return _prato_da_linha(linha) if linha else None
    finally:
        cursor.close()
        conexao.close()


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
    conexao = conectar_banco()
    cursor = conexao.cursor(dictionary=True)
    try:
        if g.usuario.perfil == "administrador":
            cursor.execute(
                """
                SELECT id, nome, preco, descricao, categoria, ativo
                FROM pratos
                ORDER BY id
                """
            )
        else:
            cursor.execute(
                """
                SELECT id, nome, preco, descricao, categoria, ativo
                FROM pratos
                WHERE ativo = TRUE
                ORDER BY id
                """
            )

        pratos = [_prato_da_linha(linha).to_dict() for linha in cursor.fetchall()]
        return jsonify(pratos), 200
    except Error:
        conexao.rollback()
        return jsonify({"erro": "Não foi possível carregar os pratos."}), 500
    finally:
        cursor.close()
        conexao.close()


@prato_controller.route("/pratos", methods=["POST"])
@perfil_requerido("administrador")
def criar_prato():
    try:
        campos = validar_prato(request.get_json(silent=True) or {})
    except ValueError as erro:
        return jsonify({"erro": str(erro)}), 400

    conexao = conectar_banco()
    cursor = conexao.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            INSERT INTO pratos (nome, descricao, preco, categoria, ativo, admin_id)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                campos["nome"],
                campos["descricao"],
                campos["preco"],
                campos["categoria"],
                campos["ativo"],
                g.usuario.id
            )
        )
        novo_id = cursor.lastrowid
        conexao.commit()

        cursor.execute(
            """
            SELECT id, nome, preco, descricao, categoria, ativo
            FROM pratos
            WHERE id = %s
            """,
            (novo_id,)
        )
        prato = _prato_da_linha(cursor.fetchone())
        flash(f'Prato "{prato.nome}" cadastrado.', "success")
        return jsonify(prato.to_dict()), 201
    except Error:
        conexao.rollback()
        return jsonify({
            "erro": "Não foi possível cadastrar o prato. Verifique a conexão e os dados do banco."
        }), 500
    finally:
        cursor.close()
        conexao.close()


@prato_controller.route("/pratos/<int:id>", methods=["PUT"])
@perfil_requerido("administrador")
def atualizar_prato(id):
    try:
        campos = validar_prato(request.get_json(silent=True) or {})
    except ValueError as erro:
        return jsonify({"erro": str(erro)}), 400

    conexao = conectar_banco()
    cursor = conexao.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            UPDATE pratos
            SET nome = %s, descricao = %s, preco = %s, categoria = %s, ativo = %s
            WHERE id = %s
            """,
            (
                campos["nome"],
                campos["descricao"],
                campos["preco"],
                campos["categoria"],
                campos["ativo"],
                id
            )
        )

        if cursor.rowcount == 0:
            cursor.execute("SELECT id FROM pratos WHERE id = %s", (id,))
            if cursor.fetchone() is None:
                return jsonify({"erro": "Prato não encontrado."}), 404

        conexao.commit()
        cursor.execute(
            """
            SELECT id, nome, preco, descricao, categoria, ativo
            FROM pratos
            WHERE id = %s
            """,
            (id,)
        )
        prato = _prato_da_linha(cursor.fetchone())
        flash(f'Prato "{prato.nome}" atualizado.', "success")
        return jsonify(prato.to_dict()), 200
    except Error:
        conexao.rollback()
        return jsonify({"erro": "Não foi possível atualizar o prato."}), 500
    finally:
        cursor.close()
        conexao.close()


@prato_controller.route("/pratos/<int:id>", methods=["DELETE"])
@perfil_requerido("administrador")
def remover_prato(id):
    conexao = conectar_banco()
    cursor = conexao.cursor()
    try:
        cursor.execute("DELETE FROM pratos WHERE id = %s", (id,))
        if cursor.rowcount == 0:
            return jsonify({"erro": "Prato não encontrado."}), 404

        conexao.commit()
        flash(f"Prato #{id} removido do cardápio.", "info")
        return jsonify({"id": id}), 200
    except IntegrityError:
        conexao.rollback()
        return jsonify({
            "erro": "Este prato já está associado a um pedido e não pode ser excluído. Inative-o pelo cardápio."
        }), 409
    except Error:
        conexao.rollback()
        return jsonify({"erro": "Não foi possível remover o prato."}), 500
    finally:
        cursor.close()
        conexao.close()
