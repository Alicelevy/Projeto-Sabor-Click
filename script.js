// =========================
// DADOS DO SISTEMA
// =========================

// Cardápio completo
const pratos = [
    { id: 1, nome: "Hambúrguer Artesanal", preco: 25.00, descricao: "Pão brioche, carne 180g, queijo, alface e tomate", categoria: "Lanches" },
    { id: 2, nome: "Macarrão ao Molho", preco: 22.00, descricao: "Macarrão com molho bolonhesa e queijo parmesão", categoria: "Massas" },
    { id: 3, nome: "Batata Frita", preco: 12.00, descricao: "Batata frita crocante com sal e pimenta", categoria: "Acompanhamentos" },
    { id: 4, nome: "Salada Caesar", preco: 18.00, descricao: "Alface, frango, croutons e molho caesar", categoria: "Saladas" },
    { id: 5, nome: "Pizza Margherita", preco: 32.00, descricao: "Mussarela, tomate e manjericão", categoria: "Pizzas" },
    { id: 6, nome: "Suco Natural", preco: 8.00, descricao: "Suco feito com frutas frescas", categoria: "Bebidas" }
];

// Estoque de ingredientes
const estoque = [
    { id: 1, nome: "Carne", quantidade: 50, unidade: "kg", minimo: 10 },
    { id: 2, nome: "Pão", quantidade: 100, unidade: "un", minimo: 20 },
    { id: 3, nome: "Queijo", quantidade: 30, unidade: "kg", minimo: 5 },
    { id: 4, nome: "Macarrão", quantidade: 40, unidade: "kg", minimo: 10 },
    { id: 5, nome: "Batata", quantidade: 60, unidade: "kg", minimo: 15 }
];

// Pedidos
let pedidos = [
    { id: 1024, cliente: "João Silva", itens: ["Hambúrguer Artesanal"], total: 25.00, status: "preparo", data: "2026-09-07 14:30" },
    { id: 1023, cliente: "Maria Santos", itens: ["Macarrão ao Molho"], total: 22.00, status: "pronto", data: "2026-09-07 14:15" },
    { id: 1022, cliente: "Pedro Oliveira", itens: ["Batata Frita"], total: 12.00, status: "recebido", data: "2026-09-07 14:00" }
];

// Reservas
let reservas = [
    { id: 1, cliente: "Ana Costa", data: "2026-09-08", horario: "10:00", bancada: "A1", status: "confirmada" },
    { id: 2, cliente: "Carlos Lima", data: "2026-09-08", horario: "14:00", bancada: "B2", status: "pendente" }
];

// =========================
// CARRINHO
// =========================

let carrinho = [];

// =========================
// FUNÇÕES DO CARRINHO
// =========================

function adicionarAoCarrinho(nome, preco) {
    const produtoExistente = carrinho.find(produto => produto.nome === nome);

    if (produtoExistente) {
        produtoExistente.quantidade++;
    } else {
        carrinho.push({ nome, preco, quantidade: 1 });
    }

    mostrarCarrinho();
    mostrarNotificacao(`${nome} adicionado ao carrinho! 🛒`, "success");
}

function alterarQuantidade(nome, quantidade) {
    if (quantidade <= 0) {
        carrinho = carrinho.filter(produto => produto.nome !== nome);
    } else {
        const produto = carrinho.find(produto => produto.nome === nome);
        if (produto) {
            produto.quantidade = quantidade;
        }
    }
    mostrarCarrinho();
}

function calcularSubtotal(produto) {
    return produto.preco * produto.quantidade;
}

function calcularTotal() {
    return carrinho.reduce((total, produto) => total + calcularSubtotal(produto), 0);
}

function finalizarPedido() {
    if (carrinho.length === 0) {
        mostrarNotificacao("Carrinho vazio! Adicione itens primeiro.", "error");
        return;
    }

    const novoPedido = {
        id: pedidos.length + 1024,
        cliente: "Cliente App",
        itens: carrinho.map(p => p.nome),
        total: calcularTotal(),
        status: "recebido",
        data: new Date().toLocaleString()
    };

    pedidos.unshift(novoPedido);
    carrinho = [];
    mostrarCarrinho();
    mostrarNotificacao("Pedido realizado com sucesso! 🎉", "success");
    setTimeout(() => mostrarPedidos(), 1500);
}

// =========================
// NOTIFICAÇÕES
// =========================

function mostrarNotificacao(mensagem, tipo = "info") {
    const notificacao = document.createElement("div");
    notificacao.className = `notificacao notificacao-${tipo}`;
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        background: ${tipo === "success" ? "#4caf50" : tipo === "error" ? "#f44336" : "#2196f3"};
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(notificacao);
    setTimeout(() => {
        notificacao.style.animation = "slideOut 0.3s ease";
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}

// =========================
// FUNÇÃO PARA MOSTRAR CARRINHO
// =========================

function mostrarCarrinho() {
    const carrinhoElemento = document.getElementById("carrinho");

    if (!carrinhoElemento) {
        return;
    }

    if (carrinho.length === 0) {
        carrinhoElemento.innerHTML = "<p>Seu carrinho está vazio.</p>";
        return;
    }

    let html = "";

    carrinho.forEach(produto => {
        const nomeEscapado = produto.nome.replace(/'/g, "\\'");
        
        html += `
            <div class="pedido">
                <div>
                    <strong>${produto.nome}</strong>
                    <div class="controles-quantidade">
                        <button onclick="alterarQuantidade('${nomeEscapado}', ${produto.quantidade - 1})">−</button>
                        <span>${produto.quantidade}</span>
                        <button onclick="alterarQuantidade('${nomeEscapado}', ${produto.quantidade + 1})">+</button>
                    </div>
                </div>
                <span>R$ ${calcularSubtotal(produto).toFixed(2).replace(".", ",")}</span>
            </div>
        `;
    });

    html += `
        <h3>Total: R$ ${calcularTotal().toFixed(2).replace(".", ",")}</h3>
    `;

    carrinhoElemento.innerHTML = html;
}

// =========================
// PÁGINA: INÍCIO
// =========================

function mostrarInicio() {
    const conteudo = document.getElementById("conteudo");
    const totalPratos = pratos.length;
    const pedidosHoje = pedidos.filter(p => p.data.includes(new Date().toDateString())).length;
    const reservasHoje = reservas.filter(r => r.data === new Date().toISOString().split('T')[0]).length;
    const itensEstoque = estoque.filter(i => i.quantidade < i.minimo).length;

    conteudo.innerHTML = `
        <section class="boas-vindas">
            <h2>🏠 Bem-vindo ao Sabor & Clic!</h2>
            <p>Gerencie seus pedidos, cardápio e espaço gastronômico em um só lugar.</p>
        </section>

        <section class="metricas-grid">
            <div class="metrica">
                <div class="rotulo">🍽️ Pratos Cadastrados</div>
                <div class="valor">${totalPratos}</div>
                <div class="variacao positiva">+2 este mês</div>
            </div>
            <div class="metrica">
                <div class="rotulo">📦 Pedidos Hoje</div>
                <div class="valor">${pedidosHoje}</div>
                <div class="variacao positiva">+5 vs ontem</div>
            </div>
            <div class="metrica">
                <div class="rotulo">📅 Reservas Hoje</div>
                <div class="valor">${reservasHoje}</div>
                <div class="variacao">${reservasHoje > 0 ? '✅ Ocupado' : '🟢 Disponível'}</div>
            </div>
            <div class="metrica">
                <div class="rotulo">⚠️ Estoque Crítico</div>
                <div class="valor">${itensEstoque}</div>
                <div class="variacao ${itensEstoque > 0 ? 'negativa' : 'positiva'}">
                    ${itensEstoque > 0 ? '⚠️ Repor estoque!' : '✅ Todos ok!'}
                </div>
            </div>
        </section>

        <section class="pedidos">
            <h2>📋 Pedidos Recentes</h2>
            ${pedidos.slice(0, 3).map(pedido => `
                <div class="pedido">
                    <div>
                        <strong>#${pedido.id}</strong>
                        <p>${pedido.cliente} - ${pedido.itens.join(', ')}</p>
                    </div>
                    <span class="status status-${pedido.status}">
                        ${pedido.status === 'recebido' ? 'Recebido' : 
                          pedido.status === 'preparo' ? 'Em Preparo' : 
                          pedido.status === 'pronto' ? 'Pronto' : 'Entregue'}
                    </span>
                </div>
            `).join('')}
        </section>
    `;
}

// =========================
// PÁGINA: CARDÁPIO
// =========================

function mostrarCardapio() {
    const conteudo = document.getElementById("conteudo");

    let html = `
        <section class="boas-vindas">
            <h2>📋 Cardápio</h2>
            <p>Escolha os pratos disponíveis no Sabor & Clic.</p>
        </section>

        <div class="cardapio-grid">
    `;

    pratos.forEach(prato => {
        const nomeEscapado = prato.nome.replace(/'/g, "\\'");
        html += `
            <div class="cardapio-item">
                <h3>${prato.nome}</h3>
                <p class="descricao">${prato.descricao}</p>
                <p class="preco">R$ ${prato.preco.toFixed(2).replace(".", ",")}</p>
                <button onclick="adicionarAoCarrinho('${nomeEscapado}', ${prato.preco})">
                    🛒 Adicionar ao carrinho
                </button>
            </div>
        `;
    });

    html += `
        </div>

        <section class="pedidos" style="margin-top: 30px;">
            <h2>🛒 Seu Carrinho</h2>
            <div id="carrinho">
                <p>Seu carrinho está vazio.</p>
            </div>
            <div style="text-align: right; margin-top: 15px;">
                <button class="btn btn-success" onclick="finalizarPedido()">
                    ✅ Finalizar Pedido
                </button>
            </div>
        </section>
    `;

    conteudo.innerHTML = html;
    mostrarCarrinho();
}

// =========================
// PÁGINA: PEDIDOS
// =========================

function mostrarPedidos() {
    const conteudo = document.getElementById("conteudo");

    conteudo.innerHTML = `
        <section class="boas-vindas">
            <h2>📦 Gerenciar Pedidos</h2>
            <p>Visualize e gerencie todos os pedidos do sistema.</p>
        </section>

        <div class="tabela-container">
            <table>
                <thead>
                    <tr>
                        <th>#Pedido</th>
                        <th>Cliente</th>
                        <th>Itens</th>
                        <th>Total</th>
                        <th>Data/Hora</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidos.map(pedido => `
                        <tr>
                            <td><strong>#${pedido.id}</strong></td>
                            <td>${pedido.cliente}</td>
                            <td>${pedido.itens.join(', ')}</td>
                            <td>R$ ${pedido.total.toFixed(2).replace(".", ",")}</td>
                            <td>${pedido.data}</td>
                            <td>
                                <span class="status status-${pedido.status}">
                                    ${pedido.status === 'recebido' ? 'Recebido' : 
                                      pedido.status === 'preparo' ? 'Em Preparo' : 
                                      pedido.status === 'pronto' ? 'Pronto' : 'Entregue'}
                                </span>
                            </td>
                            <td class="actions">
                                ${pedido.status !== 'entregue' ? `
                                    <button class="btn btn-primary" onclick="alterarStatusPedido(${pedido.id}, 'preparo')">⏳ Preparar</button>
                                    <button class="btn btn-success" onclick="alterarStatusPedido(${pedido.id}, 'pronto')">✅ Pronto</button>
                                    <button class="btn btn-warning" onclick="alterarStatusPedido(${pedido.id}, 'entregue')">📦 Entregar</button>
                                ` : '<span style="color: #999;">✓ Entregue</span>'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function alterarStatusPedido(id, novoStatus) {
    const pedido = pedidos.find(p => p.id === id);
    if (pedido) {
        pedido.status = novoStatus;
        mostrarNotificacao(`Pedido #${id} atualizado para ${novoStatus}!`, "success");
        mostrarPedidos();
    }
}

// =========================
// PÁGINA: COZINHA (KDS)
// =========================

function mostrarCozinha() {
    const conteudo = document.getElementById("conteudo");
    const pedidosCozinha = pedidos.filter(p => p.status !== 'entregue');

    conteudo.innerHTML = `
        <section class="boas-vindas">
            <h2>👨‍🍳 Cozinha - KDS</h2>
            <p>Gerencie a produção dos pedidos em tempo real.</p>
        </section>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            ${pedidosCozinha.length === 0 ? `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: #fffaf3; border-radius: 12px;">
                    <h3>🎉 Todos os pedidos foram entregues!</h3>
                    <p>Não há pedidos na fila da cozinha.</p>
                </div>
            ` : pedidosCozinha.map(pedido => `
                <div style="background: #fffaf3; padding: 20px; border-radius: 12px; border-left: 5px solid ${pedido.status === 'recebido' ? '#ff9800' : pedido.status === 'preparo' ? '#2196f3' : '#4caf50'};">
                    <h3 style="color: #c65d21;">#${pedido.id}</h3>
                    <p><strong>👤 Cliente:</strong> ${pedido.cliente}</p>
                    <p><strong>🍽️ Itens:</strong> ${pedido.itens.join(', ')}</p>
                    <p><strong>⏱️ Tempo:</strong> ${Math.floor(Math.random() * 20) + 5} min</p>
                    <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                        ${pedido.status === 'recebido' ? `
                            <button class="btn btn-primary" onclick="alterarStatusPedido(${pedido.id}, 'preparo')">
                                ⏳ Iniciar Preparo
                            </button>
                        ` : ''}
                        ${pedido.status === 'preparo' ? `
                            <button class="btn btn-success" onclick="alterarStatusPedido(${pedido.id}, 'pronto')">
                                ✅ Marcar como Pronto
                            </button>
                        ` : ''}
                        ${pedido.status === 'pronto' ? `
                            <button class="btn btn-warning" onclick="alterarStatusPedido(${pedido.id}, 'entregue')">
                                📦 Entregar
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// =========================
// PÁGINA: RESERVAS
// =========================

function mostrarReservas() {
    const conteudo = document.getElementById("conteudo");

    conteudo.innerHTML = `
        <section class="boas-vindas">
            <h2>📅 Reservas de Bancadas</h2>
            <p>Gerencie as reservas das estações de trabalho.</p>
        </section>

        <div style="background: #fffaf3; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
            <h3>➕ Nova Reserva</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div class="form-group">
                    <label>Cliente</label>
                    <input type="text" id="reservaCliente" placeholder="Nome do cliente">
                </div>
                <div class="form-group">
                    <label>Data</label>
                    <input type="date" id="reservaData">
                </div>
                <div class="form-group">
                    <label>Horário</label>
                    <input type="time" id="reservaHorario">
                </div>
                <div class="form-group">
                    <label>Bancada</label>
                    <select id="reservaBancada">
                        <option value="A1">Bancada A1</option>
                        <option value="A2">Bancada A2</option>
                        <option value="B1">Bancada B1</option>
                        <option value="B2">Bancada B2</option>
                    </select>
                </div>
            </div>
            <button class="btn btn-primary" onclick="adicionarReserva()">➕ Adicionar Reserva</button>
        </div>

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
                    ${reservas.map(reserva => `
                        <tr>
                            <td>${reserva.id}</td>
                            <td>${reserva.cliente}</td>
                            <td>${reserva.data}</td>
                            <td>${reserva.horario}</td>
                            <td>${reserva.bancada}</td>
                            <td>
                                <span class="status-reserva ${reserva.status}">
                                    ${reserva.status === 'confirmada' ? '✅ Confirmada' : 
                                      reserva.status === 'pendente' ? '⏳ Pendente' : '❌ Cancelada'}
                                </span>
                            </td>
                            <td class="actions">
                                ${reserva.status === 'pendente' ? `
                                    <button class="btn btn-success" onclick="confirmarReserva(${reserva.id})">✅ Confirmar</button>
                                ` : ''}
                                <button class="btn btn-danger" onclick="cancelarReserva(${reserva.id})">❌ Cancelar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function adicionarReserva() {
    const cliente = document.getElementById("reservaCliente").value;
    const data = document.getElementById("reservaData").value;
    const horario = document.getElementById("reservaHorario").value;
    const bancada = document.getElementById("reservaBancada").value;

    if (!cliente || !data || !horario || !bancada) {
        mostrarNotificacao("Preencha todos os campos!", "error");
        return;
    }

    const novaReserva = {
        id: reservas.length + 1,
        cliente,
        data,
        horario,
        bancada,
        status: "pendente"
    };

    reservas.push(novaReserva);
    mostrarNotificacao("Reserva criada com sucesso!", "success");
    mostrarReservas();
}

function confirmarReserva(id) {
    const reserva = reservas.find(r => r.id === id);
    if (reserva) {
        reserva.status = "confirmada";
        mostrarNotificacao("Reserva confirmada!", "success");
        mostrarReservas();
    }
}

function cancelarReserva(id) {
    const reserva = reservas.find(r => r.id === id);
    if (reserva) {
        reserva.status = "cancelada";
        mostrarNotificacao("Reserva cancelada.", "info");
        mostrarReservas();
    }
}

// =========================
// PÁGINA: ESTOQUE
// =========================

function mostrarEstoque() {
    const conteudo = document.getElementById("conteudo");

    conteudo.innerHTML = `
        <section class="boas-vindas">
            <h2>📦 Controle de Estoque</h2>
            <p>Gerencie os ingredientes e insumos da cozinha.</p>
        </section>

        <div class="tabela-container">
            <table>
                <thead>
                    <tr>
                        <th>Ingrediente</th>
                        <th>Quantidade</th>
                        <th>Unidade</th>
                        <th>Mínimo</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${estoque.map(item => `
                        <tr>
                            <td><strong>${item.nome}</strong></td>
                            <td>${item.quantidade}</td>
                            <td>${item.unidade}</td>
                            <td>${item.minimo}</td>
                            <td>
                                <span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; 
                                    background: ${item.quantidade < item.minimo ? '#ffcdd2' : '#c8e6c9'};
                                    color: ${item.quantidade < item.minimo ? '#c62828' : '#2e7d32'};">
                                    ${item.quantidade < item.minimo ? '⚠️ Crítico' : '✅ Ok'}
                                </span>
                            </td>
                            <td class="actions">
                                <button class="btn btn-primary" onclick="adicionarEstoque(${item.id})">➕ Adicionar</button>
                                <button class="btn btn-danger" onclick="removerEstoque(${item.id})">➖ Remover</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function adicionarEstoque(id) {
    const item = estoque.find(i => i.id === id);
    if (item) {
        const quantidade = prompt(`Quantos ${item.unidade} de ${item.nome} deseja adicionar?`, "10");
        if (quantidade && !isNaN(quantidade) && quantidade > 0) {
            item.quantidade += parseInt(quantidade);
            mostrarNotificacao(`Adicionado ${quantidade}${item.unidade} de ${item.nome}!`, "success");
            mostrarEstoque();
        }
    }
}

function removerEstoque(id) {
    const item = estoque.find(i => i.id === id);
    if (item) {
        const quantidade = prompt(`Quantos ${item.unidade} de ${item.nome} deseja remover?`, "5");
        if (quantidade && !isNaN(quantidade) && quantidade > 0) {
            if (item.quantidade - parseInt(quantidade) < 0) {
                mostrarNotificacao("Quantidade insuficiente em estoque!", "error");
                return;
            }
            item.quantidade -= parseInt(quantidade);
            mostrarNotificacao(`Removido ${quantidade}${item.unidade} de ${item.nome}!`, "info");
            mostrarEstoque();
        }
    }
}

// =========================
// PÁGINA: RELATÓRIOS
// =========================

function mostrarRelatorios() {
    const conteudo = document.getElementById("conteudo");
    
    const totalVendas = pedidos.reduce((sum, p) => sum + p.total, 0);
    const pedidosPorStatus = {
        recebido: pedidos.filter(p => p.status === 'recebido').length,
        preparo: pedidos.filter(p => p.status === 'preparo').length,
        pronto: pedidos.filter(p => p.status === 'pronto').length,
        entregue: pedidos.filter(p => p.status === 'entregue').length
    };

    conteudo.innerHTML = `
        <section class="boas-vindas">
            <h2>📊 Relatórios</h2>
            <p>Visualize os dados analíticos do seu negócio.</p>
        </section>

        <section class="metricas-grid">
            <div class="metrica">
                <div class="rotulo">💰 Faturamento Total</div>
                <div class="valor">R$ ${totalVendas.toFixed(2).replace(".", ",")}</div>
                <div class="variacao positiva">+15% este mês</div>
            </div>
            <div class="metrica">
                <div class="rotulo">📦 Total de Pedidos</div>
                <div class="valor">${pedidos.length}</div>
                <div class="variacao positiva">+8% este mês</div>
            </div>
            <div class="metrica">
                <div class="rotulo">📅 Reservas Realizadas</div>
                <div class="valor">${reservas.length}</div>
                <div class="variacao">${reservas.filter(r => r.status === 'confirmada').length} confirmadas</div>
            </div>
            <div class="metrica">
                <div class="rotulo">📊 Ticket Médio</div>
                <div class="valor">R$ ${pedidos.length > 0 ? (totalVendas / pedidos.length).toFixed(2).replace(".", ",") : "0,00"}</div>
                <div class="variacao positiva">+5% vs mês passado</div>
            </div>
        </section>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
            <div style="background: #fffaf3; padding: 20px; border-radius: 12px; text-align: center;">
                <h4>📥 Recebidos</h4>
                <p style="font-size: 32px; font-weight: bold; color: #ff9800;">${pedidosPorStatus.recebido}</p>
            </div>
            <div style="background: #fffaf3; padding: 20px; border-radius: 12px; text-align: center;">
                <h4>⏳ Em Preparo</h4>
                <p style="font-size: 32px; font-weight: bold; color: #2196f3;">${pedidosPorStatus.preparo}</p>
            </div>
            <div style="background: #fffaf3; padding: 20px; border-radius: 12px; text-align: center;">
                <h4>✅ Prontos</h4>
                <p style="font-size: 32px; font-weight: bold; color: #4caf50;">${pedidosPorStatus.pronto}</p>
            </div>
            <div style="background: #fffaf3; padding: 20px; border-radius: 12px; text-align: center;">
                <h4>📦 Entregues</h4>
                <p style="font-size: 32px; font-weight: bold; color: #9e9e9e;">${pedidosPorStatus.entregue}</p>
            </div>
        </div>
    `;
}

// =========================
// PÁGINA: CONFIGURAÇÕES
// =========================

function mostrarConfiguracoes() {
    const conteudo = document.getElementById("conteudo");

    conteudo.innerHTML = `
        <section class="boas-vindas">
            <h2>⚙️ Configurações</h2>
            <p>Configure as preferências do sistema.</p>
        </section>

        <div style="background: #fffaf3; padding: 25px; border-radius: 12px; max-width: 600px;">
            <div class="form-group">
                <label>Nome do Restaurante</label>
                <input type="text" value="Sabor & Clic" disabled>
            </div>
            <div class="form-group">
                <label>Usuário Atual</label>
                <input type="text" value="Alice (Gerente)" disabled>
            </div>
            <div class="form-group">
                <label>Email de Contato</label>
                <input type="email" value="contato@saborclic.com.br" disabled>
            </div>
            <div class="form-group">
                <label>Telefone</label>
                <input type="tel" value="(11) 99999-9999" disabled>
            </div>
            <div class="form-group">
                <label>Horário de Funcionamento</label>
                <input type="text" value="Segunda a Sábado: 10h às 22h" disabled>
            </div>
            <button class="btn btn-primary" onclick="mostrarNotificacao('Configurações salvas!', 'success')">
                💾 Salvar Configurações
            </button>
        </div>
    `;
}

// =========================
// FUNÇÃO LOGOUT
// =========================

function fazerLogout() {
    if (confirm("Tem certeza que deseja sair?")) {
        mostrarNotificacao("Saindo do sistema... Até logo! 👋", "info");
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

// =========================
// NAVEGAÇÃO DO MENU
// =========================

document.addEventListener("DOMContentLoaded", function() {
    const linksMenu = document.querySelectorAll(".menu-lateral a");

    linksMenu.forEach(link => {
        link.addEventListener("click", function(event) {
            event.preventDefault();

            linksMenu.forEach(item => {
                item.classList.remove("ativo");
            });

            this.classList.add("ativo");

            const pagina = this.dataset.pagina;

            switch(pagina) {
                case "inicio":
                    mostrarInicio();
                    break;
                case "cardapio":
                    mostrarCardapio();
                    break;
                case "pedidos":
                    mostrarPedidos();
                    break;
                case "cozinha":
                    mostrarCozinha();
                    break;
                case "reservas":
                    mostrarReservas();
                    break;
                case "estoque":
                    mostrarEstoque();
                    break;
                case "relatorios":
                    mostrarRelatorios();
                    break;
                case "configuracoes":
                    mostrarConfiguracoes();
                    break;
                default:
                    mostrarInicio();
            }
        });
    });

    // Carrega a página inicial
    mostrarInicio();
});

// =========================
// ANIMAÇÕES CSS (via JavaScript)
// =========================

// Adiciona as animações ao documento
const styleAnimations = document.createElement("style");
styleAnimations.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(styleAnimations);