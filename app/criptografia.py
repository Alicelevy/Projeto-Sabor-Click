
import os

from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

chave = os.getenv("FERNET_KEY")

if not chave:
    raise RuntimeError("FERNET_KEY não configurada no .env")

fernet = Fernet(chave.encode())


def encrypt(dado):
    if not dado:
        return dado

    return fernet.encrypt(dado.encode()).decode()


def decrypt(dado):
    if not dado:
        return dado

    return fernet.decrypt(dado.encode()).decode()
