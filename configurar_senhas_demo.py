
from werkzeug.security import generate_password_hash
from app.conexao import conectar_banco


senhas_demo = {
    1: "Admin@123",
    2: "Cliente@123",
    3: "Cozinha@123"
}

conexao = None
cursor = None

try:
    conexao = conectar_banco()
    cursor = conexao.cursor()

    for usuario_id, senha in senhas_demo.items():
        senha_hash = generate_password_hash(senha)

        cursor.execute("""
            UPDATE usuarios
            SET senha = %s
            WHERE id = %s
        """, (senha_hash, usuario_id))

        if cursor.rowcount == 0:
            raise ValueError(
                f"Usuário com ID {usuario_id} não encontrado."
            )

    conexao.commit()

    print("Senhas de demonstração configuradas com sucesso!")
    print("Carlos Gestor: Admin@123")
    print("Ana Cliente: Cliente@123")
    print("Bruno Cozinheiro: Cozinha@123")

except Exception as erro:
    if conexao and conexao.is_connected():
        conexao.rollback()

    print("Erro ao configurar as senhas:", erro)

finally:
    if cursor:
        cursor.close()

    if conexao and conexao.is_connected():
        conexao.close()
