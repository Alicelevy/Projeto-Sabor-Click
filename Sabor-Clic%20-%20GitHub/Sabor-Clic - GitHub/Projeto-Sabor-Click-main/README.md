# Sabor & Clic
**Sistema de Gestão para Dark Kitchens e Espaços Gastronômicos**

Projeto Integrador — 2026  
Instituto Federal de Educação, Ciência e Tecnologia de São Paulo — Campus São Paulo

## 1. Sobre o projeto

O Sabor & Clic é um sistema web desenvolvido para auxiliar na gestão de espaços gastronômicos e dark kitchens. O sistema permite o gerenciamento de pratos, pedidos, usuários, reservas e estoque.

O projeto utiliza:
- **Frontend:** HTML5, CSS3 e JavaScript.
- **Backend:** Python com Flask.
- **Banco de dados:** MySQL.
- **Comunicação:** Fetch API e JSON.

## 2. Organização dos arquivos

O arquivo `requirements.txt` está localizado na pasta externa, enquanto o código principal está dentro da pasta `Projeto Integrador`.

Estrutura simplificada:

```text
Pasta principal/
├── requirements.txt
├── README.md
└── Projeto Integrador/
    ├── run.py
    ├── .env.example
    ├── CONFIGURACAO_MYSQL.txt
    ├── database/
    │   └── sabor_clic_banco.sql
    └── app/
```

## 3. Requisitos para execução

Antes de iniciar, instale:
- Python 3;
- MySQL Server;
- Um navegador atualizado.

## 4. Instalação das dependências

Abra o terminal na **pasta principal**, onde está localizado o arquivo `requirements.txt`.

Crie e ative o ambiente virtual:

```bash
python -m venv .venv
.venv\Scripts\activate
```

Instale as dependências:

```bash
python -m pip install -r requirements.txt
```

**Importante:** execute esse comando na pasta em que o `requirements.txt` está localizado, e não dentro de `Projeto Integrador`.

## 5. Configuração do banco de dados

1. Inicie o serviço do MySQL.
2. Abra o MySQL Workbench.
3. Importe o arquivo `Projeto Integrador/database/sabor_clic_banco.sql`.
4. Execute o script para criar o banco de dados e suas tabelas.

Consulte o arquivo `CONFIGURACAO_MYSQL.txt`, localizado na pasta `Projeto Integrador`, para orientações adicionais.

## 6. Configuração do arquivo .env

Dentro da pasta `Projeto Integrador`, copie o arquivo `.env.example` e renomeie a cópia para `.env`.

Configure as variáveis de ambiente com os dados do seu computador:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=SUA_SENHA_DO_MYSQL
DB_NAME=sabor_clic
SECRET_KEY=SUA_CHAVE_SECRETA
FERNET_KEY=CHAVE_FERNET_FORNECIDA_PELA_EQUIPE
```

**Atenção:** a chave `FERNET_KEY` precisa ser a mesma utilizada pela equipe para criptografar os endereços armazenados no banco de dados. Ela deve ser compartilhada separadamente e com segurança. Não utilize uma chave aleatória diferente.

O arquivo `.env` contém informações confidenciais e não deve ser compartilhado publicamente.

## 7. Execução do sistema

Após instalar as dependências e configurar o banco de dados e o arquivo `.env`:

1. No terminal, entre na pasta `Projeto Integrador`:

```bash
cd "Projeto Integrador"
```

2. Execute a aplicação:

```bash
python run.py
```

3. Com o servidor iniciado, acesse no navegador:

```text
http://127.0.0.1:5000/
```

O MySQL precisa permanecer em execução durante o uso do sistema.

## 8. Observações

- O ambiente virtual `.venv` é criado localmente e não precisa ser enviado na entrega.
- O arquivo `.env` deve ser configurado individualmente em cada computador.
- O arquivo `.env.example` serve como modelo de configuração.
- O banco de dados deve ser importado antes de iniciar a aplicação.
