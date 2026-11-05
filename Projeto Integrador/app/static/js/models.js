// =========================
// USUÁRIOS E NÍVEIS DE ACESSO
// =========================

export class Usuario {
    #id;
    #nome;
    #email;

    constructor({ id, nome, email }) {
        this.#id = id;
        this.#nome = nome;
        this.#email = email;
    }

    get id() {
        return this.#id;
    }

    get nome() {
        return this.#nome;
    }

    get email() {
        return this.#email;
    }

    get perfil() {
        throw new Error("Cada tipo de usuário deve informar seu perfil.");
    }

    get rotuloPerfil() {
        throw new Error("Cada tipo de usuário deve informar seu rótulo.");
    }

    get paginas() {
        return [];
    }

    get paginaInicial() {
        return this.paginas[0];
    }

    podeAcessar(pagina) {
        return this.paginas.includes(pagina);
    }

    static deJSON(dados) {
        const classes = {
            administrador: Administrador,
            cliente: Cliente,
            cozinheiro: Cozinheiro
        };

        const Classe = classes[dados.perfil];

        if (!Classe) {
            throw new Error(`Perfil desconhecido: ${dados.perfil}`);
        }

        return new Classe(dados);
    }
}

export class Administrador extends Usuario {
    get perfil() {
        return "administrador";
    }

    get rotuloPerfil() {
        return "👑 Administrador";
    }

    get paginas() {
        return ["inicio", "cardapio", "pedidos", "cozinha", "reservas", "estoque", "relatorios", "conta"];
    }
}

export class Cliente extends Usuario {
    get perfil() {
        return "cliente";
    }

    get rotuloPerfil() {
        return "🙋 Cliente";
    }

    get paginas() {
        return ["cardapio", "pedidos", "conta"];
    }
}

export class Cozinheiro extends Usuario {
    get perfil() {
        return "cozinheiro";
    }

    get rotuloPerfil() {
        return "👨‍🍳 Cozinheiro";
    }

    get paginas() {
        return ["cozinha", "pedidos", "conta"];
    }
}

// =========================
// CARDÁPIO
// =========================

export class Prato {
    #id;
    #nome;
    #preco;
    #descricao;
    #categoria;
    #ativo;

    constructor({ id = null, nome, preco, descricao, categoria, ativo = true }) {
        this.#id = id;
        this.nome = nome;
        this.preco = preco;
        this.descricao = descricao;
        this.categoria = categoria;
        this.ativo = ativo;
    }

    get id() {
        return this.#id;
    }

    get nome() {
        return this.#nome;
    }

    set nome(valor) {
        this.#nome = Prato.#textoObrigatorio(valor, "Informe o nome do prato.");
    }

    get preco() {
        return this.#preco;
    }

    set preco(valor) {
        const preco = Number(valor);

        if (!Number.isFinite(preco) || preco <= 0 || preco >= 10000) {
            throw new Error("O preço deve estar entre R$ 0,01 e R$ 9.999,99.");
        }

        this.#preco = Math.round(preco * 100) / 100;
    }

    get descricao() {
        return this.#descricao;
    }

    set descricao(valor) {
        this.#descricao = Prato.#textoObrigatorio(valor, "Informe a descrição do prato.");
    }

    get categoria() {
        return this.#categoria;
    }

    set categoria(valor) {
        this.#categoria = Prato.#textoObrigatorio(valor, "Informe a categoria do prato.");
    }

    get ativo() {
        return this.#ativo;
    }

    set ativo(valor) {
        this.#ativo = Boolean(valor);
    }

    paraJSON() {
        return {
            nome: this.#nome,
            preco: this.#preco,
            descricao: this.#descricao,
            categoria: this.#categoria,
            ativo: this.#ativo
        };
    }

    static deJSON(dados) {
        return new Prato(dados);
    }

    static #textoObrigatorio(valor, mensagemErro) {
        const texto = String(valor ?? "").trim();

        if (!texto) {
            throw new Error(mensagemErro);
        }

        return texto;
    }
}

// =========================
// CARRINHO
// =========================

export class ItemPedido {
    #prato;
    #quantidade;

    constructor(prato, quantidade = 1) {
        this.#prato = prato;
        this.quantidade = quantidade;
    }

    get prato() {
        return this.#prato;
    }

    get quantidade() {
        return this.#quantidade;
    }

    set quantidade(valor) {
        if (!Number.isInteger(valor) || valor < 1) {
            throw new Error("A quantidade deve ser um número inteiro maior que zero.");
        }

        this.#quantidade = valor;
    }

    get subtotal() {
        return this.#prato.preco * this.#quantidade;
    }

    paraJSON() {
        return {
            prato_id: this.#prato.id,
            quantidade: this.#quantidade
        };
    }
}

export class Carrinho {
    #itens = new Map();

    get itens() {
        return [...this.#itens.values()];
    }

    get estaVazio() {
        return this.#itens.size === 0;
    }

    get total() {
        return this.itens.reduce((soma, item) => soma + item.subtotal, 0);
    }

    get quantidadeTotal() {
        return this.itens.reduce((soma, item) => soma + item.quantidade, 0);
    }

    adicionar(prato) {
        const item = this.#itens.get(prato.id);

        if (item) {
            item.quantidade += 1;
        } else {
            this.#itens.set(prato.id, new ItemPedido(prato));
        }
    }

    alterarQuantidade(pratoId, quantidade) {
        if (quantidade <= 0) {
            this.#itens.delete(pratoId);
            return;
        }

        this.#itens.get(pratoId).quantidade = quantidade;
    }

    sincronizar(pratosDisponiveis) {
        const pratosPorId = new Map(pratosDisponiveis.map(prato => [prato.id, prato]));
        const removidos = [];

        for (const [id, item] of this.#itens) {
            const pratoAtual = pratosPorId.get(id);

            if (pratoAtual) {
                this.#itens.set(id, new ItemPedido(pratoAtual, item.quantidade));
            } else {
                removidos.push(item);
                this.#itens.delete(id);
            }
        }

        return removidos;
    }

    limpar() {
        this.#itens.clear();
    }

    paraJSON() {
        return {
            itens: this.itens.map(item => item.paraJSON())
        };
    }
}

// =========================
// PEDIDOS
// =========================

export class Pedido {
    #id;
    #cliente;
    #itens;
    #total;
    #status;
    #dataHora;
    #tempoEstimado;

    static STATUS = {
        recebido: "Recebido",
        preparo: "Em Preparo",
        pronto: "Pronto para Entrega",
        entregue: "Entregue"
    };

    static #PROXIMO_STATUS = {
        recebido: "preparo",
        preparo: "pronto",
        pronto: "entregue"
    };

    constructor({ id, cliente, itens, total, status, data_hora, tempo_estimado }) {
        this.#id = id;
        this.#cliente = cliente;
        this.#itens = itens;
        this.#total = Number(total);
        this.#status = status;
        this.#dataHora = new Date(data_hora);
        this.#tempoEstimado = tempo_estimado;
    }

    get id() {
        return this.#id;
    }

    get cliente() {
        return this.#cliente;
    }

    get total() {
        return this.#total;
    }

    get status() {
        return this.#status;
    }

    get rotuloStatus() {
        return Pedido.STATUS[this.#status];
    }

    get proximoStatus() {
        return Pedido.#PROXIMO_STATUS[this.#status] ?? null;
    }

    get estaAberto() {
        return this.#status !== "entregue";
    }

    get tempoEstimado() {
        return this.#tempoEstimado;
    }

    get itens() {
        return [...this.#itens];
    }

    get resumoItens() {
        return this.#itens
            .map(({ quantidade, nome }) => `${quantidade}x ${nome}`)
            .join(", ");
    }

    get dataFormatada() {
        return this.#dataHora.toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
        });
    }

    get minutosDesdeCriacao() {
        return Math.max(0, Math.floor((Date.now() - this.#dataHora) / 60000));
    }

    foiFeitoHoje() {
        return this.#dataHora.toDateString() === new Date().toDateString();
    }

    static deJSON(dados) {
        return new Pedido(dados);
    }
}

// =========================
// RESERVAS DE BANCADAS
// =========================

export class Reserva {
    #id;
    #cliente;
    #data;
    #horario;
    #bancada;
    #status;

    static BANCADAS = ["A1", "A2", "B1", "B2"];

    static STATUS = {
        pendente: "⏳ Pendente",
        confirmada: "✔️ Confirmada",
        cancelada: "❌ Cancelada"
    };

    constructor({ id = null, cliente, data, horario, bancada, status = "pendente" }) {
        const nomeCliente = String(cliente ?? "").trim();

        if (!nomeCliente || !data || !horario) {
            throw new Error("Preencha cliente, data e horário da reserva.");
        }

        if (!Reserva.BANCADAS.includes(bancada)) {
            throw new Error("Escolha uma bancada válida.");
        }

        this.#id = id;
        this.#cliente = nomeCliente;
        this.#data = data;
        this.#horario = horario;
        this.#bancada = bancada;
        this.#status = status;
    }

    get id() {
        return this.#id;
    }

    get cliente() {
        return this.#cliente;
    }

    get data() {
        return this.#data;
    }

    get dataFormatada() {
        const [ano, mes, dia] = this.#data.split("-");
        return `${dia}/${mes}/${ano}`;
    }

    get horario() {
        return this.#horario;
    }

    get bancada() {
        return this.#bancada;
    }

    get status() {
        return this.#status;
    }

    get rotuloStatus() {
        return Reserva.STATUS[this.#status];
    }

    ehDeHoje() {
        const hoje = new Date();
        const dataLocal = [
            hoje.getFullYear(),
            String(hoje.getMonth() + 1).padStart(2, "0"),
            String(hoje.getDate()).padStart(2, "0")
        ].join("-");

        return this.#data === dataLocal && this.#status !== "cancelada";
    }

    paraJSON() {
        return {
            cliente: this.#cliente,
            data: this.#data,
            horario: this.#horario,
            bancada: this.#bancada
        };
    }

    static deJSON(dados) {
        return new Reserva(dados);
    }
}

// =========================
// ESTOQUE
// =========================

export class ItemEstoque {
    #id;
    #nome;
    #quantidade;
    #unidade;
    #minimo;

    static UNIDADES = ["kg", "g", "l", "ml", "un"];

    constructor({ id, nome, quantidade, unidade, minimo }) {
        this.#id = id;
        this.#nome = nome;
        this.#quantidade = quantidade;
        this.#unidade = unidade;
        this.#minimo = minimo;
    }

    get id() {
        return this.#id;
    }

    get nome() {
        return this.#nome;
    }

    get quantidade() {
        return this.#quantidade;
    }

    get unidade() {
        return this.#unidade;
    }

    get minimo() {
        return this.#minimo;
    }

    get critico() {
        return this.#quantidade < this.#minimo;
    }

    static deJSON(dados) {
        return new ItemEstoque(dados);
    }
}

// =========================
// FORMATAÇÃO
// =========================

export const formatarMoeda = valor =>
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
