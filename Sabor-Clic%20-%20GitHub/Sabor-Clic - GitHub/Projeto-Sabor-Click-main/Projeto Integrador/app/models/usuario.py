
from werkzeug.security import check_password_hash

PERFIS = ["administrador", "cliente", "cozinheiro"]


class Usuario:

    def __init__(self, id, nome, email, senha, perfil, endereco=None):
        if perfil not in PERFIS:
            raise ValueError(f"Perfil inválido: {perfil}")

        self.id = id
        self.nome = nome
        self.email = email
        self.senha = senha
        self.perfil = perfil
        self.endereco = endereco

    def confere_senha(self, senha):
        if not self.senha:
            return False

        try:
            return check_password_hash(self.senha, senha)
        except (ValueError, TypeError):
            return False

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "email": self.email,
            "perfil": self.perfil
        }
