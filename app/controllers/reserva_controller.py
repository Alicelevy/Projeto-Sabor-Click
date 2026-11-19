
from datetime import date, datetime, time, timedelta

import mysql.connector

from flask import Blueprint, flash, jsonify, request

from app.conexao import conectar_banco
from app.middlewares import perfil_requerido
from app.models.reserva import Reserva, STATUS_RESERVA


reserva_controller = Blueprint("reserva", __name__)

DURACAO_RESERVA = timedelta(hours=1)


def buscar_reserva(cursor, reserva_id):
    cursor.execute("""
        SELECT
            r.id,
            r.cliente_id,
            u.nome AS cliente,
            r.bancada_id,
            b.nome AS bancada,
            r.data_inicio,
            r.data_fim,
            r.status
        FROM agendamentos_bancadas r
        JOIN usuarios u ON u.id = r.cliente_id
        JOIN bancadas b ON b.id = r.bancada_id
        WHERE r.id = %s
    """, (reserva_id,))

    dados = cursor.fetchone()

    if dados is None:
        return None

    return Reserva(
        id=dados["id"],
        cliente=dados["cliente"],
        data_inicio=dados["data_inicio"],
        data_fim=dados["data_fim"],
        bancada=dados["bancada"],
        bancada_id=dados["bancada_id"],
        status=dados["status"]
    )


def listar_todas_reservas(cursor):
    cursor.execute("""
        SELECT
            r.id,
            r.cliente_id,
            u.nome AS cliente,
            r.bancada_id,
            b.nome AS bancada,
            r.data_inicio,
            r.data_fim,
            r.status
        FROM agendamentos_bancadas r
        JOIN usuarios u ON u.id = r.cliente_id
        JOIN bancadas b ON b.id = r.bancada_id
        ORDER BY r.data_inicio
    """)

    dados = cursor.fetchall()

    return [
        Reserva(
            id=r["id"],
            cliente=r["cliente"],
            data_inicio=r["data_inicio"],
            data_fim=r["data_fim"],
            bancada=r["bancada"],
            bancada_id=r["bancada_id"],
            status=r["status"]
        ).to_dict()
        for r in dados
    ]


def validar_reserva(dados):
    try:
        cliente_id = int(dados.get("cliente_id"))
        bancada_id = int(dados.get("bancada_id"))

        data_reserva = date.fromisoformat(dados.get("data", ""))
        horario = time.fromisoformat(dados.get("horario", ""))

        inicio = datetime.combine(data_reserva, horario)
        fim = inicio + DURACAO_RESERVA

    except (TypeError, ValueError):
        raise ValueError("Informe cliente, bancada, data e horário válidos.")

    if cliente_id <= 0 or bancada_id <= 0:
        raise ValueError("Cliente ou bancada inválidos.")

    if inicio <= datetime.now():
        raise ValueError("A reserva deve ser feita para um horário futuro.")

    return cliente_id, bancada_id, inicio, fim


@reserva_controller.route("/reservas", methods=["GET"])
@perfil_requerido("administrador")
def listar_reservas():
    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        return jsonify(listar_todas_reservas(cursor)), 200

    except mysql.connector.Error:
        return jsonify({"erro": "Não foi possível consultar as reservas."}), 500

    finally:
        if cursor:
            cursor.close()
        if conexao and conexao.is_connected():
            conexao.close()


@reserva_controller.route("/reservas", methods=["POST"])
@perfil_requerido("administrador")
def criar_reserva():
    dados = request.get_json(silent=True) or {}

    try:
        cliente_id, bancada_id, inicio, fim = validar_reserva(dados)
    except ValueError as erro:
        return jsonify({"erro": str(erro)}), 400

    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        conexao.start_transaction()
        cursor = conexao.cursor(dictionary=True)

        cursor.execute("""
            SELECT id
            FROM usuarios
            WHERE id = %s AND tipo = 'cliente'
        """, (cliente_id,))

        if cursor.fetchone() is None:
            conexao.rollback()
            return jsonify({"erro": "Cliente não encontrado."}), 404

        cursor.execute("""
            SELECT id
            FROM bancadas
            WHERE id = %s AND disponivel = 1
            FOR UPDATE
        """, (bancada_id,))

        if cursor.fetchone() is None:
            conexao.rollback()
            return jsonify({"erro": "Bancada não encontrada ou indisponível."}), 404

        cursor.execute("""
            SELECT id
            FROM agendamentos_bancadas
            WHERE bancada_id = %s
              AND status != 'cancelado'
              AND data_inicio < %s
              AND data_fim > %s
            LIMIT 1
        """, (bancada_id, fim, inicio))

        if cursor.fetchone():
            conexao.rollback()
            return jsonify({
                "erro": "Esta bancada já possui uma reserva nesse horário."
            }), 409

        cursor.execute("""
            INSERT INTO agendamentos_bancadas
                (bancada_id, cliente_id, data_inicio, data_fim, status)
            VALUES (%s, %s, %s, %s, 'pendente')
        """, (bancada_id, cliente_id, inicio, fim))

        reserva_id = cursor.lastrowid
        conexao.commit()

        cursor = conexao.cursor(dictionary=True)
        reserva = buscar_reserva(cursor, reserva_id)

        flash("Reserva criada com sucesso!", "success")

        return jsonify(reserva.to_dict()), 201

    except mysql.connector.Error:
        if conexao and conexao.is_connected():
            conexao.rollback()

        return jsonify({"erro": "Não foi possível salvar a reserva."}), 500

    finally:
        if cursor:
            cursor.close()
        if conexao and conexao.is_connected():
            conexao.close()


@reserva_controller.route("/reservas/<int:id>/status", methods=["PUT"])
@perfil_requerido("administrador")
def atualizar_status_reserva(id):
    dados = request.get_json(silent=True) or {}
    status = dados.get("status")

    # Aceita também os nomes antigos enviados pela interface.
    equivalencias = {
        "confirmada": "confirmado",
        "cancelada": "cancelado"
    }

    status = equivalencias.get(status, status)

    if status not in STATUS_RESERVA:
        return jsonify({"erro": "Status inválido."}), 400

    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        cursor.execute("""
            UPDATE agendamentos_bancadas
            SET status = %s
            WHERE id = %s
        """, (status, id))

        if cursor.rowcount == 0:
            cursor.execute("""
                SELECT id FROM agendamentos_bancadas WHERE id = %s
            """, (id,))

            if cursor.fetchone() is None:
                return jsonify({"erro": "Reserva não encontrada."}), 404

        conexao.commit()

        reserva = buscar_reserva(cursor, id)

        flash(f"Reserva #{id} atualizada.", "success")

        return jsonify(reserva.to_dict()), 200

    except mysql.connector.Error:
        if conexao and conexao.is_connected():
            conexao.rollback()

        return jsonify({"erro": "Não foi possível atualizar a reserva."}), 500

    finally:
        if cursor:
            cursor.close()
        if conexao and conexao.is_connected():
            conexao.close()


@reserva_controller.route("/reservas/<int:id>", methods=["DELETE"])
@perfil_requerido("administrador")
def remover_reserva(id):
    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor()

        cursor.execute("""
            DELETE FROM agendamentos_bancadas
            WHERE id = %s
        """, (id,))

        if cursor.rowcount == 0:
            return jsonify({"erro": "Reserva não encontrada."}), 404

        conexao.commit()

        flash(f"Reserva #{id} excluída.", "info")

        return jsonify({"id": id}), 200

    except mysql.connector.Error:
        if conexao and conexao.is_connected():
            conexao.rollback()

        return jsonify({"erro": "Não foi possível excluir a reserva."}), 500

    finally:
        if cursor:
            cursor.close()
        if conexao and conexao.is_connected():
            conexao.close()
