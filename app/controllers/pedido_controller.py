
from flask import Blueprint, flash, g, jsonify, request
import mysql.connector

from app.conexao import conectar_banco
from app.middlewares import perfil_requerido
from app.models.pedido import STATUS_PEDIDO, Pedido

pedido_controller = Blueprint("pedido", __name__)


def buscar_pedido(cursor, id):
    """Busca um pedido e seus respectivos itens no MySQL."""

    cursor.execute("""
        SELECT
            p.id,
            p.cliente_id,
            u.nome AS cliente,
            p.status,
            p.tempo_estimado,
            p.data_pedido
        FROM pedidos p
        INNER JOIN usuarios u ON u.id = p.cliente_id
        WHERE p.id = %s
    """, (id,))

    dados = cursor.fetchone()

    if dados is None:
        return None

    cursor.execute("""
        SELECT
            ip.prato_id,
            pr.nome,
            ip.preco_unitario,
            ip.quantidade
        FROM itens_pedido ip
        INNER JOIN pratos pr ON pr.id = ip.prato_id
        WHERE ip.pedido_id = %s
    """, (id,))

    itens = []
    total = 0

    for item in cursor.fetchall():
        preco = float(item["preco_unitario"])
        quantidade = item["quantidade"]

        itens.append({
            "prato_id": item["prato_id"],
            "nome": item["nome"],
            "preco": preco,
            "quantidade": quantidade
        })

        total += preco * quantidade

    return Pedido(
        id=dados["id"],
        cliente_id=dados["cliente_id"],
        cliente=dados["cliente"],
        itens=itens,
        total=round(total, 2),
        status=dados["status"],
        data_hora=dados["data_pedido"],
        tempo_estimado=dados["tempo_estimado"]
    )


def montar_itens(cursor, itens_recebidos):
    """Valida os pratos diretamente no banco de dados."""

    if not isinstance(itens_recebidos, list) or not itens_recebidos:
        raise ValueError("Adicione pelo menos um item ao pedido.")

    itens = []

    for item in itens_recebidos:
        try:
            prato_id = int(item["prato_id"])
            quantidade = int(item["quantidade"])
        except (KeyError, TypeError, ValueError):
            raise ValueError(
                "Os itens devem conter prato e quantidade válidos."
            )

        if quantidade <= 0:
            raise ValueError(
                "A quantidade de cada item deve ser maior que zero."
            )

        cursor.execute("""
            SELECT id, nome, preco, ativo
            FROM pratos
            WHERE id = %s
        """, (prato_id,))

        prato = cursor.fetchone()

        if prato is None or not prato["ativo"]:
            raise LookupError(
                "Um dos pratos do carrinho não está mais disponível. "
                "Atualize o cardápio e tente novamente."
            )

        itens.append({
            "prato_id": prato["id"],
            "nome": prato["nome"],
            "preco": float(prato["preco"]),
            "quantidade": quantidade
        })

    return itens


@pedido_controller.route("/pedidos", methods=["GET"])
@perfil_requerido()
def listar_pedidos():
    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        if g.usuario.perfil == "cliente":
            cursor.execute("""
                SELECT id
                FROM pedidos
                WHERE cliente_id = %s
                ORDER BY data_pedido DESC, id DESC
            """, (g.usuario.id,))
        else:
            cursor.execute("""
                SELECT id
                FROM pedidos
                ORDER BY data_pedido DESC, id DESC
            """)

        resultados = cursor.fetchall()

        pedidos = []

        for resultado in resultados:
            pedido = buscar_pedido(cursor, resultado["id"])

            if pedido is not None:
                pedidos.append(pedido.to_dict())

        return jsonify(pedidos)

    except mysql.connector.Error:
        return jsonify({"erro": "Não foi possível consultar os pedidos."}), 500

    finally:
        if cursor:
            cursor.close()
        if conexao and conexao.is_connected():
            conexao.close()


@pedido_controller.route("/pedidos", methods=["POST"])
@perfil_requerido("cliente")
def criar_pedido():
    dados = request.get_json(silent=True) or {}

    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        itens = montar_itens(cursor, dados.get("itens"))

        cursor.execute("""
            INSERT INTO pedidos (cliente_id, status)
            VALUES (%s, %s)
        """, (g.usuario.id, "Aguardando"))

        novo_id = cursor.lastrowid

        for item in itens:
            cursor.execute("""
                INSERT INTO itens_pedido
                    (pedido_id, prato_id, quantidade, preco_unitario)
                VALUES (%s, %s, %s, %s)
            """, (
                novo_id,
                item["prato_id"],
                item["quantidade"],
                item["preco"]
            ))

        conexao.commit()

        pedido = buscar_pedido(cursor, novo_id)

        flash(
            f"Pedido #{novo_id} realizado com sucesso! 🎉",
            "success"
        )

        return jsonify(pedido.to_dict()), 201

    except ValueError as erro:
        if conexao and conexao.is_connected():
            conexao.rollback()
        return jsonify({"erro": str(erro)}), 400

    except LookupError as erro:
        if conexao and conexao.is_connected():
            conexao.rollback()
        return jsonify({"erro": str(erro)}), 409

    except mysql.connector.Error:
        if conexao and conexao.is_connected():
            conexao.rollback()
        return jsonify({
            "erro": "Não foi possível registrar o pedido. "
                    "Verifique a disponibilidade dos ingredientes."
        }), 409

    finally:
        if cursor:
            cursor.close()
        if conexao and conexao.is_connected():
            conexao.close()


@pedido_controller.route("/pedidos/<int:id>/status", methods=["PUT"])
@perfil_requerido("cozinheiro", "administrador")
def atualizar_status(id):
    dados = request.get_json(silent=True) or {}
    status = dados.get("status")

    if status not in STATUS_PEDIDO:
        return jsonify({"erro": "Status inválido."}), 400

    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        cursor.execute("""
            UPDATE pedidos
            SET status = %s
            WHERE id = %s
        """, (status, id))

        if cursor.rowcount == 0:
            cursor.execute(
                "SELECT id FROM pedidos WHERE id = %s",
                (id,)
            )

            if cursor.fetchone() is None:
                return jsonify({"erro": "Pedido não encontrado."}), 404

        conexao.commit()

        pedido = buscar_pedido(cursor, id)

        flash(f"Pedido #{id} atualizado.", "success")

        return jsonify(pedido.to_dict()), 200

    except mysql.connector.Error:
        if conexao and conexao.is_connected():
            conexao.rollback()
        return jsonify({"erro": "Não foi possível atualizar o pedido."}), 500

    finally:
        if cursor:
            cursor.close()
        if conexao and conexao.is_connected():
            conexao.close()


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

    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        cursor.execute("""
            UPDATE pedidos
            SET tempo_estimado = %s
            WHERE id = %s
        """, (minutos, id))

        if cursor.rowcount == 0:
            cursor.execute(
                "SELECT id FROM pedidos WHERE id = %s",
                (id,)
            )

            if cursor.fetchone() is None:
                return jsonify({"erro": "Pedido não encontrado."}), 404

        conexao.commit()

        pedido = buscar_pedido(cursor, id)

        flash(
            f"Tempo do pedido #{id} definido em {minutos} min.",
            "success"
        )

        return jsonify(pedido.to_dict()), 200

    except mysql.connector.Error:
        if conexao and conexao.is_connected():
            conexao.rollback()
        return jsonify({
            "erro": "Não foi possível atualizar o tempo do pedido."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conexao and conexao.is_connected():
            conexao.close()
