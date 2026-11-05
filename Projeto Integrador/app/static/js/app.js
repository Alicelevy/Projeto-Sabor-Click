import { Api, ErroApi } from "./api.js";
import { Carrinho, ItemEstoque, Pedido, Prato, Reserva, formatarMoeda } from "./models.js";

// =========================
// ESTADO DA APLICAÇÃO
// =========================

const INTERVALO_ATUALIZACAO_MS = 15000;

const estado = {
    usuario: null,
    pagina: null,
    pratos: [],
    pedidos: [],
    reservas: [],
    estoque: [],
    carrinho: new Carrinho(),
    pratoEmEdicao: null
};

const elementos = {
    telaLogin: document.getElementById("tela-login"),
    formLogin: document.getElementById("form-login"),
    layout: document.getElementById("layout"),
    areaUsuario: document.getElementById("area-usuario"),
    nomeUsuario: document.getElementById("nome-usuario"),
    botaoSair: document.getElementById("btn-sair"),
    linksMenu: document.querySelectorAll(".menu-lateral a"),
    conteudo: document.getElementById("conteudo"),
    indicador: document.getElementById("indicador-carregando"),
    notificacoes: document.getElementById("notificacoes")
};

let requisicoesAtivas = 0;
let atualizacaoAutomatica = null;

// =========================
// UTILITÁRIOS DE INTERFACE
// =========================

const CARACTERES_HTML = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" };

const escapar = texto => String(texto).replace(/[&<>"']/g, caractere => CARACTERES_HTML[caractere]);

const buscarPorId = (lista, id) => lista.find(item => item.id === Number(id));

const plural = (quantidade, singular, varios) => `${quantidade} ${quantidade === 1 ? singular : varios}`;

function notificar(mensagem, tipo = "info") {
    const notificacao = document.createElement("div");

    notificacao.className = `notificacao notificacao-${tipo}`;
    notificacao.textContent = mensagem;
    elementos.notificacoes.append(notificacao);

    setTimeout(() => {
        notificacao.classList.add("saindo");
        notificacao.addEventListener("animationend", () => notificacao.remove(), { once: true });
    }, 3000);
}

function alterarCarregamento(diferenca) {
    requisicoesAtivas += diferenca;

    const carregando = requisicoesAtivas > 0;

    elementos.indicador.hidden = !carregando;
    elementos.conteudo.setAttribute("aria-busy", String(carregando));
    document.body.classList.toggle("carregando", carregando);
}

/**
 * Executa uma ação assíncrona mostrando o carregamento e tratando erros.
 * Retorna true se deu certo e false se algo falhou.
 */
async function executar(acao, { silencioso = false } = {}) {
    if (!silencioso) {
        alterarCarregamento(1);
    }

    try {
        await acao();
        return true;

    } catch (erro) {
        if (erro instanceof ErroApi && erro.sessaoExpirada && estado.usuario) {
            encerrarSessao();
            notificar("Sua sessão expirou. Entre novamente.", "error");
        } else if (!silencioso) {
            notificar(erro.message, "error");
        }

        return false;

    } finally {
        if (!silencioso) {
            alterarCarregamento(-1);
        }
    }
}

// =========================
// CARREGAMENTO DE DADOS
// =========================

function avisarRemovidosDoCarrinho(removidos) {
    if (removidos.length > 0) {
        const nomes = removidos.map(item => item.prato.nome).join(", ");
        notificar(`Saiu do cardápio e foi removido do carrinho: ${nomes}.`, "info");
    }
}

const carregar = {
    pratos: async () => {
        estado.pratos = await Api.listarPratos();
        avisarRemovidosDoCarrinho(estado.carrinho.sincronizar(estado.pratos));
    },
    pedidos: async () => {
        estado.pedidos = await Api.listarPedidos();
    },
    reservas: async () => {
        estado.reservas = await Api.listarReservas();
    },
    estoque: async () => {
        estado.estoque = await Api.listarEstoque();
    }
};

const DADOS_DA_PAGINA = {
    inicio: ["pratos", "pedidos", "reservas", "estoque"],
    cardapio: ["pratos"],
    pedidos: ["pedidos"],
    cozinha: ["pedidos"],
    reservas: ["reservas"],
    estoque: ["estoque"],
    relatorios: ["pedidos", "reservas"],
    conta: []
};

const carregarDados = nomes => Promise.all(nomes.map(nome => carregar[nome]()));

// =========================
// COMPONENTES REUTILIZÁVEIS
// =========================

const cabecalho = (titulo, descricao) => `
    <section class="boas-vindas">
        <h2>${titulo}</h2>
        <p>${descricao}</p>
    </section>
`;

const metrica = (rotulo, valor, detalhe, classe = "") => `
    <div class="metrica">
        <div class="rotulo">${rotulo}</div>
        <div class="valor">${valor}</div>
        <div class="variacao ${classe}">${detalhe}</div>
    </div>
`;

const etiquetaPedido = pedido => `
    <span class="status status-${pedido.status}">${pedido.rotuloStatus}</span>
`;

const ROTULOS_PROXIMO_STATUS = {
    preparo: { texto: "⏳ Iniciar Preparo", classe: "btn-primary" },
    pronto: { texto: "✔️ Pronto para Entrega", classe: "btn-success" },
    entregue: { texto: "📦 Entregar", classe: "btn-warning" }
};

function botaoProximoStatus(pedido) {
    const proximo = pedido.proximoStatus;

    if (!proximo) {
        return "";
    }

    const { texto, classe } = ROTULOS_PROXIMO_STATUS[proximo];

    return `
        <button class="btn ${classe}" data-acao="avancar-status" data-id="${pedido.id}" data-status="${proximo}">
            ${texto}
        </button>
    `;
}

const textoTempoEstimado = pedido =>
    pedido.tempoEstimado ? `${pedido.tempoEstimado} min` : "A definir";

const linhaVazia = (colunas, mensagem) => `
    <tr><td colspan="${colunas}" class="mensagem-vazia">${mensagem}</td></tr>
`;

// =========================
// PÁGINA: INÍCIO (ADMINISTRADOR)
// =========================

function paginaInicio() {
    const pratosAtivos = estado.pratos.filter(prato => prato.ativo).length;
    const pratosInativos = estado.pratos.length - pratosAtivos;
    const pedidosHoje = estado.pedidos.filter(pedido => pedido.foiFeitoHoje()).length;
    const pedidosAbertos = estado.pedidos.filter(pedido => pedido.estaAberto).length;
    const reservasHoje = estado.reservas.filter(reserva => reserva.ehDeHoje()).length;
    const reservasPendentes = estado.reservas.filter(reserva => reserva.status === "pendente").length;
    const itensCriticos = estado.estoque.filter(item => item.critico);

    const detalheEstoque = itensCriticos.length > 0
        ? `Repor: ${itensCriticos.map(item => escapar(item.nome)).join(", ")}`
        : "✔️ Todos ok";

    const pedidosRecentes = estado.pedidos.slice(0, 5);

    return `
        ${cabecalho(`🏠 Olá, ${escapar(estado.usuario.nome)}!`, "Resumo do Sabor & Clic em tempo real.")}

        <section class="metricas-grid">
            ${metrica("🍽️ Pratos Ativos", pratosAtivos, plural(pratosInativos, "inativo", "inativos"))}
            ${metrica("📦 Pedidos Hoje", pedidosHoje, plural(pedidosAbertos, "em aberto", "em aberto"))}
            ${metrica("📅 Reservas Hoje", reservasHoje, plural(reservasPendentes, "pendente", "pendentes"))}
            ${metrica("⚠️ Estoque Crítico", itensCriticos.length, detalheEstoque,
                itensCriticos.length > 0 ? "negativa" : "positiva")}
        </section>

        <section class="pedidos">
            <h2>📋 Pedidos Recentes</h2>
            ${pedidosRecentes.length === 0 ? `<p class="mensagem-vazia">Nenhum pedido ainda.</p>` : ""}
            ${pedidosRecentes.map(pedido => `
                <div class="pedido">
                    <div>
                        <strong>#${pedido.id}</strong>
                        <p>${escapar(pedido.cliente)} - ${escapar(pedido.resumoItens)}</p>
                    </div>
                    ${etiquetaPedido(pedido)}
                </div>
            `).join("")}
        </section>
    `;
}

// =========================
// PÁGINA: CARDÁPIO (ADMINISTRADOR)
// =========================

function formularioPrato() {
    const prato = estado.pratoEmEdicao;
    const valor = campo => (prato ? escapar(prato[campo]) : "");

    return `
        <form class="painel" data-formulario="prato" novalidate>
            <h3>${prato ? `✏️ Editando: ${escapar(prato.nome)}` : "➕ Novo prato"}</h3>

            <div class="grade-formulario">
                <div class="form-group">
                    <label for="prato-nome">Nome</label>
                    <input type="text" id="prato-nome" name="nome" maxlength="80" value="${valor("nome")}" required>
                </div>
                <div class="form-group">
                    <label for="prato-preco">Preço (R$)</label>
                    <input type="number" id="prato-preco" name="preco" min="0.01" step="0.01" value="${valor("preco")}" required>
                </div>
                <div class="form-group">
                    <label for="prato-categoria">Categoria</label>
                    <input type="text" id="prato-categoria" name="categoria" maxlength="40" value="${valor("categoria")}" required>
                </div>
                <div class="form-group">
                    <label for="prato-descricao">Descrição</label>
                    <input type="text" id="prato-descricao" name="descricao" maxlength="200" value="${valor("descricao")}" required>
                </div>
            </div>

            <label class="campo-checkbox">
                <input type="checkbox" name="ativo" ${!prato || prato.ativo ? "checked" : ""}>
                Exibir no cardápio dos clientes
            </label>

            <div class="acoes-formulario">
                <button type="submit" class="btn btn-primary">💾 ${prato ? "Salvar alterações" : "Cadastrar prato"}</button>
                ${prato ? `<button type="button" class="btn btn-secundario" data-acao="cancelar-edicao">Cancelar</button>` : ""}
            </div>
        </form>
    `;
}

function paginaCardapioAdmin() {
    return `
        ${cabecalho("📋 Gerenciar Cardápio", "Cadastre, edite, remova e ative ou inative os pratos.")}

        ${formularioPrato()}

        <div class="tabela-container">
            <table>
                <thead>
                    <tr>
                        <th>Prato</th>
                        <th>Categoria</th>
                        <th>Preço</th>
                        <th>Situação</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${estado.pratos.length === 0 ? linhaVazia(5, "Nenhum prato cadastrado.") : ""}
                    ${estado.pratos.map(prato => `
                        <tr>
                            <td>
                                <strong>${escapar(prato.nome)}</strong>
                                <p class="texto-secundario">${escapar(prato.descricao)}</p>
                            </td>
                            <td>${escapar(prato.categoria)}</td>
                            <td>${formatarMoeda(prato.preco)}</td>
                            <td>
                                <span class="status ${prato.ativo ? "status-ativo" : "status-inativo"}">
                                    ${prato.ativo ? "Ativo" : "Inativo"}
                                </span>
                            </td>
                            <td class="actions">
                                <button class="btn btn-primary" data-acao="editar-prato" data-id="${prato.id}">✏️ Editar</button>
                                <button class="btn btn-warning" data-acao="alternar-prato" data-id="${prato.id}">
                                    ${prato.ativo ? "🚫 Inativar" : "✔️ Ativar"}
                                </button>
                                <button class="btn btn-danger" data-acao="remover-prato" data-id="${prato.id}">🗑️ Remover</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

async function salvarPrato(formulario) {
    const dados = Object.fromEntries(new FormData(formulario));
    const pratoEditado = estado.pratoEmEdicao;

    const salvou = await executar(async () => {
        const prato = new Prato({ ...dados, ativo: formulario.elements.ativo.checked });

        if (pratoEditado) {
            await Api.atualizarPrato(pratoEditado.id, prato);
        } else {
            await Api.criarPrato(prato);
        }

        await carregar.pratos();
    });

    if (salvou) {
        estado.pratoEmEdicao = null;
        renderizar();
    }
}

function editarPrato({ id }) {
    estado.pratoEmEdicao = buscarPorId(estado.pratos, id);
    renderizar();
    document.getElementById("prato-nome").focus();
}

function cancelarEdicao() {
    estado.pratoEmEdicao = null;
    renderizar();
}

async function alternarPrato({ id }) {
    const prato = buscarPorId(estado.pratos, id);

    const alterou = await executar(async () => {
        const atualizado = new Prato({ ...prato.paraJSON(), ativo: !prato.ativo });
        await Api.atualizarPrato(prato.id, atualizado);
        await carregar.pratos();
    });

    if (alterou) {
        renderizar();
    }
}

async function removerPrato({ id }) {
    const prato = buscarPorId(estado.pratos, id);

    if (!confirm(`Remover "${prato.nome}" do cardápio?`)) {
        return;
    }

    const removeu = await executar(async () => {
        await Api.removerPrato(prato.id);
        await carregar.pratos();
    });

    if (removeu) {
        if (estado.pratoEmEdicao?.id === prato.id) {
            estado.pratoEmEdicao = null;
        }

        renderizar();
    }
}

// =========================
// PÁGINA: CARDÁPIO (CLIENTE)
// =========================

function conteudoCarrinho() {
    const { carrinho } = estado;

    if (carrinho.estaVazio) {
        return "<p>Seu carrinho está vazio.</p>";
    }

    return `
        ${carrinho.itens.map(({ prato, quantidade, subtotal }) => `
            <div class="pedido">
                <div>
                    <strong>${escapar(prato.nome)}</strong>
                    <div class="controles-quantidade">
                        <button data-acao="quantidade" data-id="${prato.id}" data-quantidade="${quantidade - 1}"
                            aria-label="Diminuir quantidade">−</button>
                        <span>${quantidade}</span>
                        <button data-acao="quantidade" data-id="${prato.id}" data-quantidade="${quantidade + 1}"
                            aria-label="Aumentar quantidade">+</button>
                    </div>
                </div>
                <span>${formatarMoeda(subtotal)}</span>
            </div>
        `).join("")}
        <h3>Total: ${formatarMoeda(carrinho.total)}</h3>
    `;
}

function paginaCardapioCliente() {
    const pratos = estado.pratos;

    return `
        ${cabecalho("📋 Cardápio", "Escolha os pratos disponíveis no Sabor & Clic.")}

        <div class="cardapio-grid">
            ${pratos.length === 0 ? `<p class="mensagem-vazia">Nenhum prato disponível no momento.</p>` : ""}
            ${pratos.map(prato => `
                <div class="cardapio-item">
                    <span class="categoria-prato">${escapar(prato.categoria)}</span>
                    <h3>${escapar(prato.nome)}</h3>
                    <p class="descricao">${escapar(prato.descricao)}</p>
                    <p class="preco">${formatarMoeda(prato.preco)}</p>
                    <button data-acao="adicionar-carrinho" data-id="${prato.id}">🛒 Adicionar ao carrinho</button>
                </div>
            `).join("")}
        </div>

        <section class="pedidos secao-carrinho">
            <h2>🛒 Seu Carrinho (${estado.carrinho.quantidadeTotal})</h2>
            <div id="carrinho">${conteudoCarrinho()}</div>
            <div class="acoes-carrinho">
                <button class="btn btn-success" data-acao="finalizar-pedido" ${estado.carrinho.estaVazio ? "disabled" : ""}>
                    ✔️ Finalizar Pedido
                </button>
            </div>
        </section>
    `;
}

function adicionarAoCarrinho({ id }) {
    const prato = buscarPorId(estado.pratos, id);

    estado.carrinho.adicionar(prato);
    renderizar();
    notificar(`${prato.nome} adicionado ao carrinho! 🛒`, "success");
}

function alterarQuantidade({ id, quantidade }) {
    estado.carrinho.alterarQuantidade(Number(id), Number(quantidade));
    renderizar();
}

async function finalizarPedido() {
    if (estado.carrinho.estaVazio) {
        notificar("Carrinho vazio! Adicione itens primeiro.", "error");
        return;
    }

    const enviou = await executar(async () => {
        await Api.criarPedido(estado.carrinho);
        estado.carrinho.limpar();
    });

    if (enviou) {
        abrirPagina("pedidos");
        return;
    }

    if (await executar(carregar.pratos, { silencioso: true })) {
        renderizar();
    }
}

// =========================
// PÁGINA: PEDIDOS
// =========================

function paginaPedidos() {
    const ehCliente = estado.usuario.perfil === "cliente";
    const colunas = ehCliente ? 6 : 8;

    return `
        ${ehCliente
            ? cabecalho("📦 Meus Pedidos", "Acompanhe o status dos seus pedidos. A lista se atualiza sozinha.")
            : cabecalho("📦 Gerenciar Pedidos", "Visualize e atualize todos os pedidos do sistema.")}

        <div class="tabela-container">
            <table>
                <thead>
                    <tr>
                        <th>#Pedido</th>
                        ${ehCliente ? "" : "<th>Cliente</th>"}
                        <th>Itens</th>
                        <th>Total</th>
                        <th>Data/Hora</th>
                        <th>Tempo estimado</th>
                        <th>Status</th>
                        ${ehCliente ? "" : "<th>Ações</th>"}
                    </tr>
                </thead>
                <tbody>
                    ${estado.pedidos.length === 0 ? linhaVazia(colunas, "Nenhum pedido encontrado.") : ""}
                    ${estado.pedidos.map(pedido => `
                        <tr>
                            <td><strong>#${pedido.id}</strong></td>
                            ${ehCliente ? "" : `<td>${escapar(pedido.cliente)}</td>`}
                            <td>${escapar(pedido.resumoItens)}</td>
                            <td>${formatarMoeda(pedido.total)}</td>
                            <td>${pedido.dataFormatada}</td>
                            <td>${textoTempoEstimado(pedido)}</td>
                            <td>${etiquetaPedido(pedido)}</td>
                            ${ehCliente ? "" : `<td class="actions">${botaoProximoStatus(pedido) || "✔️"}</td>`}
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

async function avancarStatus({ id, status }) {
    const alterou = await executar(async () => {
        await Api.alterarStatusPedido(Number(id), status);
        await carregar.pedidos();
    });

    if (alterou) {
        renderizar();
    }
}

// =========================
// PÁGINA: COZINHA (KDS)
// =========================

function paginaCozinha() {
    const fila = estado.pedidos.filter(pedido => pedido.estaAberto).reverse();

    return `
        ${cabecalho("👨‍🍳 Cozinha - KDS", "Fila de pedidos em tempo real, do mais antigo para o mais novo.")}

        <div class="kds-grid">
            ${fila.length === 0 ? `
                <div class="painel mensagem-vazia kds-vazio">
                    <h3>🎉 Nenhum pedido na fila!</h3>
                    <p>Os novos pedidos aparecem aqui automaticamente.</p>
                </div>
            ` : ""}
            ${fila.map(pedido => `
                <article class="kds-card kds-${pedido.status}">
                    <div class="kds-topo">
                        <h3>#${pedido.id}</h3>
                        ${etiquetaPedido(pedido)}
                    </div>
                    <p><strong>👤 Cliente:</strong> ${escapar(pedido.cliente)}</p>
                    <ul class="kds-itens">
                        ${pedido.itens.map(({ quantidade, nome }) => `
                            <li><strong>${quantidade}x</strong> ${escapar(nome)}</li>
                        `).join("")}
                    </ul>
                    <p><strong>🕒 Na fila há:</strong> ${pedido.minutosDesdeCriacao} min</p>
                    <p><strong>⏱️ Tempo estimado:</strong> ${textoTempoEstimado(pedido)}</p>

                    <form class="form-inline" data-formulario="tempo" data-id="${pedido.id}">
                        <label class="visualmente-oculto" for="tempo-${pedido.id}">Tempo estimado em minutos</label>
                        <input type="number" id="tempo-${pedido.id}" name="minutos" min="1" max="240"
                            placeholder="min" value="${pedido.tempoEstimado ?? ""}" required>
                        <button type="submit" class="btn btn-secundario">Definir tempo</button>
                    </form>

                    <div class="kds-acoes">${botaoProximoStatus(pedido)}</div>
                </article>
            `).join("")}
        </div>
    `;
}

async function definirTempo(formulario) {
    const minutos = Number(formulario.elements.minutos.value);

    if (!Number.isInteger(minutos) || minutos < 1 || minutos > 240) {
        notificar("Informe um tempo entre 1 e 240 minutos.", "error");
        return;
    }

    const definiu = await executar(async () => {
        await Api.definirTempoPedido(Number(formulario.dataset.id), minutos);
        await carregar.pedidos();
    });

    if (definiu) {
        renderizar();
    }
}

// =========================
// PÁGINA: RESERVAS
// =========================

function paginaReservas() {
    const hoje = new Date().toLocaleDateString("en-CA");

    return `
        ${cabecalho("📅 Reservas de Bancadas", "Agende as bancadas e evite conflitos de horário.")}

        <form class="painel" data-formulario="reserva" novalidate>
            <h3>➕ Nova Reserva</h3>
            <div class="grade-formulario">
                <div class="form-group">
                    <label for="reserva-cliente">Cliente</label>
                    <input type="text" id="reserva-cliente" name="cliente" maxlength="80" placeholder="Nome do cliente" required>
                </div>
                <div class="form-group">
                    <label for="reserva-data">Data</label>
                    <input type="date" id="reserva-data" name="data" min="${hoje}" required>
                </div>
                <div class="form-group">
                    <label for="reserva-horario">Horário</label>
                    <input type="time" id="reserva-horario" name="horario" required>
                </div>
                <div class="form-group">
                    <label for="reserva-bancada">Bancada</label>
                    <select id="reserva-bancada" name="bancada">
                        ${Reserva.BANCADAS.map(bancada => `<option value="${bancada}">Bancada ${bancada}</option>`).join("")}
                    </select>
                </div>
            </div>
            <button type="submit" class="btn btn-primary">➕ Adicionar Reserva</button>
        </form>

        <div class="tabela-container">
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Cliente</th>
                        <th>Data</th>
                        <th>Horário</th>
                        <th>Bancada</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${estado.reservas.length === 0 ? linhaVazia(7, "Nenhuma reserva cadastrada.") : ""}
                    ${estado.reservas.map(reserva => `
                        <tr>
                            <td>${reserva.id}</td>
                            <td>${escapar(reserva.cliente)}</td>
                            <td>${reserva.dataFormatada}</td>
                            <td>${reserva.horario}</td>
                            <td>${reserva.bancada}</td>
                            <td><span class="status status-${reserva.status}">${reserva.rotuloStatus}</span></td>
                            <td class="actions">
                                ${reserva.status === "pendente" ? `
                                    <button class="btn btn-success" data-acao="status-reserva" data-id="${reserva.id}" data-status="confirmada">✔️ Confirmar</button>
                                ` : ""}
                                ${reserva.status !== "cancelada" ? `
                                    <button class="btn btn-warning" data-acao="status-reserva" data-id="${reserva.id}" data-status="cancelada">❌ Cancelar</button>
                                ` : ""}
                                <button class="btn btn-danger" data-acao="remover-reserva" data-id="${reserva.id}">🗑️ Excluir</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

async function criarReserva(formulario) {
    const criou = await executar(async () => {
        const reserva = new Reserva(Object.fromEntries(new FormData(formulario)));
        await Api.criarReserva(reserva);
        await carregar.reservas();
    });

    if (criou) {
        renderizar();
    }
}

async function alterarStatusReserva({ id, status }) {
    const alterou = await executar(async () => {
        await Api.alterarStatusReserva(Number(id), status);
        await carregar.reservas();
    });

    if (alterou) {
        renderizar();
    }
}

async function removerReserva({ id }) {
    if (!confirm(`Excluir a reserva #${id}?`)) {
        return;
    }

    const removeu = await executar(async () => {
        await Api.removerReserva(Number(id));
        await carregar.reservas();
    });

    if (removeu) {
        renderizar();
    }
}

// =========================
// PÁGINA: ESTOQUE
// =========================

function paginaEstoque() {
    return `
        ${cabecalho("📦 Controle de Estoque", "Registre entradas e saídas dos ingredientes da cozinha.")}

        <form class="painel" data-formulario="item-estoque" novalidate>
            <h3>➕ Novo ingrediente</h3>
            <div class="grade-formulario">
                <div class="form-group">
                    <label for="estoque-nome">Ingrediente</label>
                    <input type="text" id="estoque-nome" name="nome" maxlength="60" required>
                </div>
                <div class="form-group">
                    <label for="estoque-quantidade">Quantidade inicial</label>
                    <input type="number" id="estoque-quantidade" name="quantidade" min="0" step="1" required>
                </div>
                <div class="form-group">
                    <label for="estoque-unidade">Unidade</label>
                    <select id="estoque-unidade" name="unidade">
                        ${ItemEstoque.UNIDADES.map(unidade => `<option value="${unidade}">${unidade}</option>`).join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label for="estoque-minimo">Estoque mínimo</label>
                    <input type="number" id="estoque-minimo" name="minimo" min="0" step="1" required>
                </div>
            </div>
            <button type="submit" class="btn btn-primary">➕ Adicionar ao estoque</button>
        </form>

        <div class="tabela-container">
            <table>
                <thead>
                    <tr>
                        <th>Ingrediente</th>
                        <th>Quantidade</th>
                        <th>Mínimo</th>
                        <th>Status</th>
                        <th>Movimentar</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${estado.estoque.length === 0 ? linhaVazia(6, "Nenhum ingrediente cadastrado.") : ""}
                    ${estado.estoque.map(item => `
                        <tr>
                            <td><strong>${escapar(item.nome)}</strong></td>
                            <td>${item.quantidade} ${item.unidade}</td>
                            <td>${item.minimo} ${item.unidade}</td>
                            <td>
                                <span class="status ${item.critico ? "status-critico" : "status-ok"}">
                                    ${item.critico ? "⚠️ Crítico" : "✔️ Ok"}
                                </span>
                            </td>
                            <td>
                                <form class="form-inline" data-formulario="ajuste-estoque" data-id="${item.id}">
                                    <label class="visualmente-oculto" for="ajuste-${item.id}">Quantidade de ${escapar(item.nome)}</label>
                                    <input type="number" id="ajuste-${item.id}" name="quantidade" min="1" step="1" placeholder="Qtd." required>
                                    <button type="submit" class="btn btn-primary" name="tipo" value="entrada">➕ Entrada</button>
                                    <button type="submit" class="btn btn-warning" name="tipo" value="saida">➖ Saída</button>
                                </form>
                            </td>
                            <td class="actions">
                                <button class="btn btn-danger" data-acao="remover-item-estoque" data-id="${item.id}">🗑️ Remover</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

const ehInteiroNaoNegativo = valor => valor !== "" && Number.isInteger(Number(valor)) && Number(valor) >= 0;

async function criarItemEstoque(formulario) {
    const { nome, quantidade, unidade, minimo } = Object.fromEntries(new FormData(formulario));

    if (!nome.trim() || !ehInteiroNaoNegativo(quantidade) || !ehInteiroNaoNegativo(minimo)) {
        notificar("Informe o nome e valores inteiros maiores ou iguais a zero.", "error");
        return;
    }

    const criou = await executar(async () => {
        await Api.criarItemEstoque({
            nome: nome.trim(),
            quantidade: Number(quantidade),
            unidade,
            minimo: Number(minimo)
        });
        await carregar.estoque();
    });

    if (criou) {
        renderizar();
    }
}

async function ajustarEstoque(formulario, botao) {
    const quantidade = Number(formulario.elements.quantidade.value);

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        notificar("Informe uma quantidade inteira maior que zero.", "error");
        return;
    }

    const ajuste = botao?.value === "saida" ? -quantidade : quantidade;

    const ajustou = await executar(async () => {
        await Api.ajustarEstoque(Number(formulario.dataset.id), ajuste);
        await carregar.estoque();
    });

    if (ajustou) {
        renderizar();
    }
}

async function removerItemEstoque({ id }) {
    const item = buscarPorId(estado.estoque, id);

    if (!confirm(`Remover ${item.nome} do estoque?`)) {
        return;
    }

    const removeu = await executar(async () => {
        await Api.removerItemEstoque(item.id);
        await carregar.estoque();
    });

    if (removeu) {
        renderizar();
    }
}

// =========================
// PÁGINA: RELATÓRIOS
// =========================

function pratosMaisVendidos(limite = 5) {
    const vendas = estado.pedidos
        .flatMap(pedido => pedido.itens)
        .reduce((acumulado, { nome, quantidade, preco }) => {
            const atual = acumulado[nome] ?? { nome, quantidade: 0, receita: 0 };

            atual.quantidade += quantidade;
            atual.receita += quantidade * preco;
            acumulado[nome] = atual;

            return acumulado;
        }, {});

    return Object.values(vendas)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, limite);
}

function paginaRelatorios() {
    const { pedidos, reservas } = estado;
    const faturamento = pedidos.reduce((soma, pedido) => soma + pedido.total, 0);
    const ticketMedio = pedidos.length > 0 ? faturamento / pedidos.length : 0;
    const confirmadas = reservas.filter(reserva => reserva.status === "confirmada").length;
    const maisVendidos = pratosMaisVendidos();

    const contagemPorStatus = Object.keys(Pedido.STATUS).map(status => ({
        status,
        rotulo: Pedido.STATUS[status],
        quantidade: pedidos.filter(pedido => pedido.status === status).length
    }));

    return `
        ${cabecalho("📊 Relatórios", "Números calculados a partir dos pedidos e reservas registrados.")}

        <section class="metricas-grid">
            ${metrica("💰 Faturamento Total", formatarMoeda(faturamento), plural(pedidos.length, "pedido", "pedidos"))}
            ${metrica("📦 Total de Pedidos", pedidos.length, plural(pedidos.filter(p => p.estaAberto).length, "em aberto", "em aberto"))}
            ${metrica("📅 Reservas", reservas.length, plural(confirmadas, "confirmada", "confirmadas"))}
            ${metrica("📊 Ticket Médio", formatarMoeda(ticketMedio), "por pedido")}
        </section>

        <section class="contagem-grid">
            ${contagemPorStatus.map(({ status, rotulo, quantidade }) => `
                <div class="painel contagem contagem-${status}">
                    <h4>${rotulo}</h4>
                    <p>${quantidade}</p>
                </div>
            `).join("")}
        </section>

        <div class="tabela-container">
            <h3 class="titulo-tabela">🏆 Pratos mais vendidos</h3>
            <table>
                <thead>
                    <tr>
                        <th>Prato</th>
                        <th>Quantidade vendida</th>
                        <th>Receita</th>
                    </tr>
                </thead>
                <tbody>
                    ${maisVendidos.length === 0 ? linhaVazia(3, "Ainda não há vendas registradas.") : ""}
                    ${maisVendidos.map(({ nome, quantidade, receita }) => `
                        <tr>
                            <td>${escapar(nome)}</td>
                            <td>${quantidade}</td>
                            <td>${formatarMoeda(receita)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

// =========================
// PÁGINA: MINHA CONTA
// =========================

function paginaConta() {
    const { nome, email, rotuloPerfil } = estado.usuario;

    return `
        ${cabecalho("👤 Minha Conta", "Dados do usuário conectado.")}

        <dl class="painel dados-conta">
            <dt>Nome</dt>
            <dd>${escapar(nome)}</dd>
            <dt>Email</dt>
            <dd>${escapar(email)}</dd>
            <dt>Nível de acesso</dt>
            <dd>${rotuloPerfil}</dd>
        </dl>
    `;
}

// =========================
// NAVEGAÇÃO
// =========================

const PAGINAS = {
    inicio: paginaInicio,
    cardapio: () => estado.usuario.perfil === "administrador" ? paginaCardapioAdmin() : paginaCardapioCliente(),
    pedidos: paginaPedidos,
    cozinha: paginaCozinha,
    reservas: paginaReservas,
    estoque: paginaEstoque,
    relatorios: paginaRelatorios,
    conta: paginaConta
};

const PAGINAS_EM_TEMPO_REAL = ["pedidos", "cozinha"];

function renderizar() {
    elementos.conteudo.innerHTML = PAGINAS[estado.pagina]();
}

function pararAtualizacaoAutomatica() {
    clearInterval(atualizacaoAutomatica);
    atualizacaoAutomatica = null;
}

function usuarioEstaDigitando() {
    const ativo = document.activeElement;
    return elementos.conteudo.contains(ativo) && ativo.matches("input, select, textarea");
}

function iniciarAtualizacaoAutomatica() {
    const pagina = estado.pagina;

    atualizacaoAutomatica = setInterval(async () => {
        if (usuarioEstaDigitando()) {
            return;
        }

        const atualizou = await executar(carregar.pedidos, { silencioso: true });

        if (atualizou && estado.pagina === pagina && !usuarioEstaDigitando()) {
            renderizar();
        }
    }, INTERVALO_ATUALIZACAO_MS);
}

async function abrirPagina(pagina) {
    if (!estado.usuario.podeAcessar(pagina)) {
        notificar("Você não tem acesso a esta área.", "error");
        return;
    }

    pararAtualizacaoAutomatica();
    estado.pagina = pagina;
    estado.pratoEmEdicao = null;

    elementos.linksMenu.forEach(link => {
        link.classList.toggle("ativo", link.dataset.pagina === pagina);
    });

    elementos.conteudo.innerHTML = `<p class="mensagem-vazia">⏳ Carregando...</p>`;

    const carregou = await executar(() => carregarDados(DADOS_DA_PAGINA[pagina]));

    if (estado.pagina !== pagina) {
        return;
    }

    if (!carregou) {
        elementos.conteudo.innerHTML = `
            <div class="painel mensagem-vazia">
                <p>Não foi possível carregar esta página.</p>
                <button class="btn btn-primary" data-acao="recarregar-pagina">🔄 Tentar novamente</button>
            </div>
        `;
        return;
    }

    renderizar();

    if (PAGINAS_EM_TEMPO_REAL.includes(pagina)) {
        iniciarAtualizacaoAutomatica();
    }
}

// =========================
// LOGIN E SESSÃO
// =========================

function mostrarTelaLogin() {
    elementos.layout.hidden = true;
    elementos.areaUsuario.hidden = true;
    elementos.telaLogin.hidden = false;
    document.getElementById("login-email").focus();
}

function iniciarPainel() {
    const { usuario } = estado;

    elementos.telaLogin.hidden = true;
    elementos.layout.hidden = false;
    elementos.areaUsuario.hidden = false;
    elementos.nomeUsuario.textContent = `👤 ${usuario.nome} (${usuario.rotuloPerfil})`;

    elementos.linksMenu.forEach(link => {
        link.hidden = !usuario.podeAcessar(link.dataset.pagina);
    });

    abrirPagina(usuario.paginaInicial);
}

function encerrarSessao() {
    pararAtualizacaoAutomatica();
    estado.usuario = null;
    estado.pagina = null;
    estado.carrinho.limpar();
    mostrarTelaLogin();
}

async function entrar(evento) {
    evento.preventDefault();

    const email = elementos.formLogin.elements.email.value.trim();
    const senha = elementos.formLogin.elements.senha.value;

    if (!email || !senha) {
        notificar("Preencha email e senha.", "error");
        return;
    }

    const entrou = await executar(async () => {
        estado.usuario = await Api.entrar(email, senha);
    });

    if (entrou) {
        elementos.formLogin.reset();
        iniciarPainel();
    }
}

async function sair() {
    if (!confirm("Tem certeza que deseja sair?")) {
        return;
    }

    if (await executar(Api.sair)) {
        encerrarSessao();
    }
}

// =========================
// EVENTOS
// =========================

const ACOES = {
    "adicionar-carrinho": adicionarAoCarrinho,
    "quantidade": alterarQuantidade,
    "finalizar-pedido": finalizarPedido,
    "editar-prato": editarPrato,
    "cancelar-edicao": cancelarEdicao,
    "alternar-prato": alternarPrato,
    "remover-prato": removerPrato,
    "avancar-status": avancarStatus,
    "status-reserva": alterarStatusReserva,
    "remover-reserva": removerReserva,
    "remover-item-estoque": removerItemEstoque,
    "recarregar-pagina": () => abrirPagina(estado.pagina)
};

const FORMULARIOS = {
    "prato": salvarPrato,
    "tempo": definirTempo,
    "reserva": criarReserva,
    "item-estoque": criarItemEstoque,
    "ajuste-estoque": ajustarEstoque
};

elementos.conteudo.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-acao]");

    if (botao && !document.body.classList.contains("carregando")) {
        ACOES[botao.dataset.acao]?.(botao.dataset);
    }
});

elementos.conteudo.addEventListener("submit", evento => {
    const tratar = FORMULARIOS[evento.target.dataset.formulario];

    if (tratar) {
        evento.preventDefault();
        tratar(evento.target, evento.submitter);
    }
});

elementos.linksMenu.forEach(link => {
    link.addEventListener("click", evento => {
        evento.preventDefault();
        abrirPagina(link.dataset.pagina);
    });
});

elementos.formLogin.addEventListener("submit", entrar);
elementos.botaoSair.addEventListener("click", sair);

Api.aoReceberMensagens(mensagens => {
    mensagens.forEach(({ categoria, texto }) => notificar(texto, categoria));
});

// =========================
// INICIALIZAÇÃO
// =========================

async function iniciar() {
    await executar(async () => {
        estado.usuario = await Api.buscarUsuarioAtual();
    });

    if (estado.usuario) {
        iniciarPainel();
    } else {
        mostrarTelaLogin();
    }
}

iniciar();
