import mimetypes
import os

from flask import Flask, render_template

# Alguns Windows registram .js como text/plain, o que impede o navegador de carregar módulos
mimetypes.add_type("text/javascript", ".js")

app = Flask(__name__, template_folder="views")
app.secret_key = os.environ.get("SECRET_KEY", "sabor-clic-desenvolvimento")

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
