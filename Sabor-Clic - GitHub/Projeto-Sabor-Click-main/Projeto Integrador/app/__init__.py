import mimetypes
import os
from pathlib import Path
from dotenv import load_dotenv

from flask import Flask, render_template

# Carrega as variáveis antes de configurar a sessão do Flask.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# Alguns Windows registram .js como text/plain, o que impede o navegador de carregar módulos
mimetypes.add_type("text/javascript", ".js")

app = Flask(__name__, template_folder="views")
chave_secreta = os.environ.get("SECRET_KEY")
if not chave_secreta:
    raise RuntimeError("SECRET_KEY não configurada no arquivo .env")
app.secret_key = chave_secreta

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    # Em produção com HTTPS, defina COOKIE_SECURE=true no ambiente.
    SESSION_COOKIE_SECURE=os.environ.get("COOKIE_SECURE", "false").lower() == "true",
)

from app.controllers.prato_controller import prato_controller
from app.controllers.pedido_controller import pedido_controller
from app.controllers.usuario_controller import usuario_controller
from app.controllers.reserva_controller import reserva_controller
from app.controllers.estoque_controller import estoque_controller
from app.middlewares import anexar_mensagens_flash

app.register_blueprint(prato_controller)
app.register_blueprint(pedido_controller)
app.register_blueprint(usuario_controller)
app.register_blueprint(reserva_controller)
app.register_blueprint(estoque_controller)

app.after_request(anexar_mensagens_flash)


@app.route("/")
def inicio():
    return render_template("index.html")
