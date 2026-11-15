# Sabor & Clic
### Sistema de Gestão para Dark Kitchens e Espaços Gastronômicos

## 1. Sobre o Projeto

O Sabor & Clic é um sistema web desenvolvido para auxiliar na gestão de dark kitchens e espaços gastronômicos compartilhados.

A aplicação reúne funcionalidades de gerenciamento de cardápio, cadastro e acompanhamento de pedidos, organização da produção da cozinha, agendamento de bancadas e controle de estoque.

O projeto foi desenvolvido como parte do Projeto Integrador, utilizando diferentes tecnologias de desenvolvimento web, programação, banco de dados e segurança da informação.

## 2. Tecnologias Utilizadas

**Front-end**
- HTML5
- CSS3
- JavaScript ES6+
- Fetch API
- JSON

**Back-end**
- Python 3
- Flask
- Blueprints

**Banco de dados**
- MySQL
- mysql-connector-python

**Segurança**
- Werkzeug Security para hash de senhas.
- Flask Sessions para gerenciamento de sessões.
- Cryptography (Fernet) para criptografia baseada em AES.

## 3. Funcionalidades

- Cadastro e autenticação de clientes.
- Controle de acesso por perfil: administrador, cliente e cozinheiro.
- Consulta e gerenciamento de pratos.
- Criação e acompanhamento de pedidos.
- Painel de produção da cozinha.
- Gerenciamento de reservas de bancadas.
- Controle de estoque e movimentação automática relacionada aos pedidos.
- Proteção de senhas por hash.
- Criptografia dos endereços dos usuários.

## 4. Organização do Projeto

```text
Projeto Integrador/
├── app/
│   ├── controllers/
│   ├── models/
│   ├── static/
│   │   ├── css/
│   │   └── js/
│   ├── views/
│   ├── conexao.py
│   ├── criptografia.py
│   └── middlewares.py
├── database/
│   └── sabor_clic_banco.sql
├── .env.example
├── CONFIGURACAO_MYSQL.txt
├── configurar_senhas_demo.py
├── requirements.txt
└── run.py
```

## 5. Requisitos para Execução

Para executar o sistema, é necessário possuir:

- Python 3 instalado.
- MySQL Server instalado e em execução.
- MySQL Workbench ou outra ferramenta para importar o banco.
- Dependências listadas em `requirements.txt`.

## 6. Instalação e Configuração

### 6.1. Banco de Dados

1. Abra o MySQL Workbench.
2. Crie ou selecione uma conexão com o servidor MySQL.
3. Importe o arquivo `database/sabor_clic_banco.sql`.
4. Confirme que o banco `sabor_clic` foi criado e que suas tabelas e dados estão disponíveis.

### 6.2. Ambiente Virtual

Abra o terminal na pasta `Projeto Integrador` e execute:

```bash
python -m venv .venv
```

Ative o ambiente virtual no Windows:

```bash
.venv\Scripts\activate
```

Instale as dependências:

```bash
python -m pip install -r requirements.txt
```

### 6.3. Variáveis de Ambiente

Faça uma cópia do arquivo `.env.example` e renomeie a cópia para `.env`.

Preencha as variáveis de conexão com o MySQL, a chave secreta do Flask e a chave Fernet.

A variável `FERNET_KEY` deve receber exatamente a mesma chave utilizada para criptografar os endereços presentes no banco SQL fornecido.

A chave Fernet deve ser obtida com a equipe responsável pelo projeto por um meio seguro. Não utilize uma chave aleatória diferente.

O arquivo `.env` contém informações confidenciais e não deve ser enviado ao repositório público.

### 6.4. Inicialização

Com o MySQL em execução e as variáveis configuradas, execute:

```bash
python run.py
```

Acesse pelo navegador:

http://127.0.0.1:5000/

## 7. Banco de Dados

O banco utilizado é o MySQL, com o nome `sabor_clic`.

O arquivo SQL disponibilizado na pasta `database` contém a estrutura das tabelas, os relacionamentos, as triggers e os dados exportados para a versão final do projeto.

## 8. Segurança

O sistema utiliza hash para proteger as senhas dos usuários e criptografia baseada em AES, por meio da biblioteca Fernet, para proteger os endereços armazenados no banco de dados.

As chaves de segurança são configuradas por variáveis de ambiente, não devendo ser inseridas diretamente no código-fonte.

## 9. Equipe

Projeto Integrador — Sabor & Clic.

Integrantes:
- Alice Peters Gonçalves do Prado Levy
- Beatriz Sati Minoura
- Clarice Cortez Generoso
- Heitor Borges Pinto

Instituto Federal de Educação, Ciência e Tecnologia de São Paulo — Campus São Paulo.

Turma: 2º ano 231.

Ano: 2026.
