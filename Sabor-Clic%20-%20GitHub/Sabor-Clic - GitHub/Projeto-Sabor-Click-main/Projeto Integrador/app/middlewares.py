from functools import wraps

from flask import g, get_flashed_messages, json, jsonify, session

from app.controllers.usuario_controller import buscar_usuario


def perfil_requerido(*perfis):
    """Bloqueia a rota para quem não está logado ou não tem um dos perfis.

    Sem perfis informados, basta estar logado.
    """

    def decorador(rota):

        @wraps(rota)
        def verificar_acesso(*args, **kwargs):
            usuario = buscar_usuario(session.get("usuario_id"))

            if usuario is None:
                return jsonify({"erro": "Faça login para continuar."}), 401

            if perfis and usuario.perfil not in perfis:
                return jsonify({
                    "erro": "Você não tem permissão para esta ação."
                }), 403

            g.usuario = usuario

            return rota(*args, **kwargs)

        return verificar_acesso

    return decorador


def anexar_mensagens_flash(resposta):
    """Envia as Flash Messages da requisição junto da resposta JSON."""

    if not resposta.is_json:
        return resposta

    dados = resposta.get_json(silent=True)

    if not isinstance(dados, dict):
        return resposta

    mensagens = get_flashed_messages(with_categories=True)

    if mensagens:
        dados["mensagens"] = [
            {"categoria": categoria, "texto": texto}
            for categoria, texto in mensagens
        ]
        resposta.set_data(json.dumps(dados))

    return resposta
