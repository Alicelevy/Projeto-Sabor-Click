import { ItemEstoque, Pedido, Prato, Reserva, Usuario } from "./models.js";

export class ErroApi extends Error {
    #status;

    constructor(mensagem, status) {
        super(mensagem);
        this.name = "ErroApi";
        this.#status = status;
    }

    get status() {
        return this.#status;
    }

    get sessaoExpirada() {
        return this.#status === 401;
    }
}

export class Api {
    static #ouvinteMensagens = null;

    static aoReceberMensagens(ouvinte) {
        Api.#ouvinteMensagens = ouvinte;
    }

    static async #requisitar(url, { metodo = "GET", corpo } = {}) {
        const opcoes = { method: metodo, headers: {} };

        if (corpo !== undefined) {
            opcoes.headers["Content-Type"] = "application/json";
            opcoes.body = JSON.stringify(corpo);
        }

        let resposta;

        try {
            resposta = await fetch(url, opcoes);
        } catch {
            throw new ErroApi("Sem conexão com o servidor. Tente novamente.", 0);
        }

        const dados = await resposta.json().catch(() => ({}));

        if (dados.mensagens) {
            Api.#ouvinteMensagens?.(dados.mensagens);
        }

        if (!resposta.ok) {
            throw new ErroApi(dados.erro || `Erro ${resposta.status} no servidor.`, resposta.status);
        }

        return dados;
    }

    // ----- Usuários -----

    static async entrar(email, senha) {
        const { usuario } = await Api.#requisitar("/login", {
            metodo: "POST",
            corpo: { email, senha }
        });

        return Usuario.deJSON(usuario);
    }

    static async sair() {
        await Api.#requisitar("/logout", { metodo: "POST" });
    }

    static async buscarUsuarioAtual() {
        const { usuario } = await Api.#requisitar("/usuario-atual");
        return usuario ? Usuario.deJSON(usuario) : null;
    }

    // ----- Pratos -----

    static async listarPratos() {
        const dados = await Api.#requisitar("/pratos");
        return dados.map(Prato.deJSON);
    }

    static async criarPrato(prato) {
        return Prato.deJSON(await Api.#requisitar("/pratos", {
            metodo: "POST",
            corpo: prato.paraJSON()
        }));
    }

    static async atualizarPrato(id, prato) {
        return Prato.deJSON(await Api.#requisitar(`/pratos/${id}`, {
            metodo: "PUT",
            corpo: prato.paraJSON()
        }));
    }

    static async removerPrato(id) {
        await Api.#requisitar(`/pratos/${id}`, { metodo: "DELETE" });
    }

    // ----- Pedidos -----

    static async listarPedidos() {
        const dados = await Api.#requisitar("/pedidos");
        return dados.map(Pedido.deJSON);
    }

    static async criarPedido(carrinho) {
        return Pedido.deJSON(await Api.#requisitar("/pedidos", {
            metodo: "POST",
            corpo: carrinho.paraJSON()
        }));
    }

    static async alterarStatusPedido(id, status) {
        return Pedido.deJSON(await Api.#requisitar(`/pedidos/${id}/status`, {
            metodo: "PUT",
            corpo: { status }
        }));
    }

    static async definirTempoPedido(id, tempoEstimado) {
        return Pedido.deJSON(await Api.#requisitar(`/pedidos/${id}/tempo`, {
            metodo: "PUT",
            corpo: { tempo_estimado: tempoEstimado }
        }));
    }

    // ----- Reservas -----

    static async listarReservas() {
        const dados = await Api.#requisitar("/reservas");
        return dados.map(Reserva.deJSON);
    }

    static async criarReserva(reserva) {
        return Reserva.deJSON(await Api.#requisitar("/reservas", {
            metodo: "POST",
            corpo: reserva.paraJSON()
        }));
    }

    static async alterarStatusReserva(id, status) {
        return Reserva.deJSON(await Api.#requisitar(`/reservas/${id}/status`, {
            metodo: "PUT",
            corpo: { status }
        }));
    }

    static async removerReserva(id) {
        await Api.#requisitar(`/reservas/${id}`, { metodo: "DELETE" });
    }

    // ----- Estoque -----

    static async listarEstoque() {
        const dados = await Api.#requisitar("/estoque");
        return dados.map(ItemEstoque.deJSON);
    }

    static async criarItemEstoque(dados) {
        return ItemEstoque.deJSON(await Api.#requisitar("/estoque", {
            metodo: "POST",
            corpo: dados
        }));
    }

    static async ajustarEstoque(id, ajuste) {
        return ItemEstoque.deJSON(await Api.#requisitar(`/estoque/${id}`, {
            metodo: "PUT",
            corpo: { ajuste }
        }));
    }

    static async removerItemEstoque(id) {
        await Api.#requisitar(`/estoque/${id}`, { metodo: "DELETE" });
    }
}
