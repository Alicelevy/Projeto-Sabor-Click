from flask import Flask, render_template

app = Flask(
    __name__,
    template_folder="views",
    static_folder="static"
)

from app.controllers.prato_controller import prato_controller
from app.controllers.pedido_controller import pedido_controller

app.register_blueprint(prato_controller)
app.register_blueprint(pedido_controller)


@app.route("/")
def index():
    return render_template("index.html")
