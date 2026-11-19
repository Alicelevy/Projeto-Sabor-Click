import os
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv


# Carrega as configurações do arquivo .env na raiz de "Projeto Integrador".
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def conectar_banco():
    """Abre uma conexão com o banco de dados MySQL do Sabor & Clic."""
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME", "sabor_clic")
    )
