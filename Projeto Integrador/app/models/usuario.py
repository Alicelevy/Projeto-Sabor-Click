PERFIS = ["administrador", "cliente", "cozinheiro"]


class Usuario:

    def __init__(self, id, nome, email, senha, perfil):
        if perfil not in PERFIS:
            raise ValueError(f"Perfil inválido: {perfil}")

        self.id = id
        self.nome = nome
        self.email = email
        self.senha = senha
        self.perfil = perfil

    def confere_senha(self, senha):
        return self.senha == senha

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "email": self.email,
            "perfil": self.perfil
        }
