
from decimal import Decimal, InvalidOperation

import mysql.connector

from flask import Blueprint, flash, jsonify, request

from app.conexao import conectar_banco
from app.middlewares import perfil_requerido
from app.models.estoque import ItemEstoque


estoque_controller = Blueprint("estoque", __name__)

UNIDADES = ["kg", "g", "l", "ml", "un"]


def converter_decimal(valor):
    try:
        numero = Decimal(str(valor))
        if not numero.is_finite():
            raise InvalidOperation
        return numero
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError("Informe uma quantidade numérica válida.")


def buscar_item(cursor, id):
    cursor.execute("""
        SELECT id, nome_item, quantidade_atual,
               unidade_medida, quantidade_minima
        FROM estoque
        WHERE id = %s
    """, (id,))

    dados = cursor.fetchone()

    if dados is None:
        return None

    return ItemEstoque(
        dados["id"],
        dados["nome_item"],
        dados["quantidade_atual"],
        dados["unidade_medida"],
        dados["quantidade_minima"]
    )


@estoque_controller.route("/estoque", methods=["GET"])
@perfil_requerido("administrador")
def listar_estoque():
    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, nome_item, quantidade_atual,
                   unidade_medida, quantidade_minima
            FROM estoque
            ORDER BY id
        """)

        itens = [
            ItemEstoque(
                item["id"],
                item["nome_item"],
                item["quantidade_atual"],
                item["unidade_medida"],
                item["quantidade_minima"]
            ).to_dict()
            for item in cursor.fetchall()
        ]

        return jsonify(itens)

    except mysql.connector.Error:
        return jsonify({"erro": "Não foi possível consultar o estoque."}), 500

    finally:
        if cursor:
            cursor.close()
        if conexao and conexao.is_connected():
            conexao.close()


@estoque_controller.route("/estoque", methods=["POST"])
@perfil_requerido("administrador")
def criar_item():
    dados = request.get_json(silent=True) or {}

    nome = str(dados.get("nome", "")).strip()
    unidade = dados.get("unidade")

    try:
        quantidade = converter_decimal(dados.get("quantidade"))
        minimo = converter_decimal(dados.get("minimo"))
    except ValueError as erro:
        return jsonify({"erro": str(erro)}), 400

    if (
        not nome
        or unidade not in UNIDADES
        or quantidade < 0
        or minimo < 0
    ):
        return jsonify({
            "erro": "Informe nome, unidade e valores maiores ou iguais a zero."
        }), 400

    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor()

        cursor.execute("""
            INSERT INTO estoque
                (nome_item, quantidade_atual, unidade_medida,
                 quantidade_minima)
            VALUES (%s, %s, %s, %s)
        """, (nome, quantidade, unidade, minimo))

        novo_id = cursor.lastrowid
        conexao.commit()

        cursor_dict = conexao.cursor(dictionary=True)
        try:
            item = buscar_item(cursor_dict, novo_id)
            resultado = item.to_dict()
        finally:
            cursor_dict.close()

        flash(f"{nome} adicionado ao estoque.", "success")

        return jsonify(resultado), 201

    except mysql.connector.Error:
        if conexao and conexao.is_connected():
            conexao.rollback()
        return jsonify({"erro": "Não foi possível cadastrar o ingrediente."}), 500

    finally:
        if cursor:
            cursor.close()
        if conexao and conexao.is_connected():
            conexao.close()


@estoque_controller.route("/estoque/<int:id>", methods=["PUT"])
@perfil_requerido("administrador")
def ajustar_item(id):
    dados = request.get_json(silent=True) or {}

    try:
        ajuste = converter_decimal(dados.get("ajuste"))
    except ValueError as erro:
        return jsonify({"erro": str(erro)}), 400

    if ajuste == 0:
        return jsonify({
            "erro": "Informe uma quantidade diferente de zero."
        }), 400

    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        cursor.execute("""
            UPDATE estoque
            SET quantidade_atual = quantidade_atual + %s
            WHERE id = %s
              AND quantidade_atual + %s >= 0
        """, (ajuste, id, ajuste))

        if cursor.rowcount == 0:
            cursor.execute("""
                SELECT quantidade_atual
                FROM estoque
                WHERE id = %s
            """, (id,))

            if cursor.fetchone() is None:
                return jsonify({"erro": "Ingrediente não encontrado."}), 404

            return jsonify({
                "erro": "Quantidade insuficiente em estoque."
            }), 400

        conexao.commit()

        item = buscar_item(cursor, id)
        resultado = item.to_dict()

        movimento = "Entrada" if ajuste > 0 else "Saída"

        flash(
            f"{movimento} de {abs(ajuste)} "
            f"{item.unidade} de {item.nome}.",
            "success"
        )

        return jsonify(resultado), 200

    except mysql.connector.Error:
        if conexao and conexao.is_connected():
            conexao.rollback()
        return jsonify({"erro": "Não foi possível ajustar o estoque."}), 500

    finally:
        if cursor:
            cursor.close()
        if conexao and conexao.is_connected():
            conexao.close()


@estoque_controller.route("/estoque/<int:id>", methods=["DELETE"])
@perfil_requerido("administrador")
def remover_item(id):
    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        item = buscar_item(cursor, id)

        if item is None:
            return jsonify({"erro": "Ingrediente não encontrado."}), 404

        cursor.execute("""
            DELETE FROM estoque
            WHERE id = %s
        """, (id,))

        conexao.commit()

        flash(f"{item.nome} removido do estoque.", "info")

        return jsonify({"id": id}), 200

    except mysql.connector.IntegrityError:
        if conexao and conexao.is_connected():
            conexao.rollback()
        return jsonify({
            "erro": "Este ingrediente está associado a fichas técnicas "
                    "e não pode ser removido."
        }), 409

    except mysql.connector.Error:
        if conexao and conexao.is_connected():
            conexao.rollback()
        return jsonify({"erro": "Não foi possível remover o ingrediente."}), 500

    finally:
        if cursor:
            cursor.close()
        if conexao and conexao.is_connected():
            conexao.close()
