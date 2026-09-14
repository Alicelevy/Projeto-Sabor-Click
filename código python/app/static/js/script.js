const pratos = [
    {
        id: 1,
        nome: "Hambúrguer Artesanal",
        preco: 25.00,
        descricao: "Pão brioche, carne 180g, queijo, alface e tomate",
        categoria: "Lanches"
    },
    {
        id: 2,
        nome: "Macarrão ao Molho",
        preco: 22.00,
        descricao: "Macarrão com molho bolonhesa e queijo parmesão",
        categoria: "Massas"
    },
    {
        id: 3,
        nome: "Batata Frita",
        preco: 12.00,
        descricao: "Batata frita crocante com sal e pimenta",
        categoria: "Acompanhamentos"
    },
    {
        id: 4,
        nome: "Salada Caesar",
        preco: 18.00,
        descricao: "Alface, frango, croutons e molho caesar",
        categoria: "Saladas"
    },
    {
        id: 5,
        nome: "Pizza Margherita",
        preco: 32.00,
        descricao: "Mussarela, tomate e manjericão",
        categoria: "Pizzas"
    },
    {
        id: 6,
        nome: "Suco Natural",
        preco: 8.00,
        descricao: "Suco feito com frutas frescas",
        categoria: "Bebidas"
    }
];


const listaPratos = document.getElementById("lista-pratos");


function mostrarPratos() {

    listaPratos.innerHTML = "";

    pratos.forEach(function(prato) {

        const div = document.createElement("div");

        div.classList.add("prato");

        div.innerHTML = `
            <h3>${prato.nome}</h3>

            <p>${prato.descricao}</p>

            <p>Categoria: ${prato.categoria}</p>

            <p class="preco">
                R$ ${prato.preco.toFixed(2)}
            </p>
        `;

        listaPratos.appendChild(div);
    });
}


mostrarPratos();


const formulario = document.getElementById("form-pedido");

formulario.addEventListener("submit", function(event) {

    event.preventDefault();

    const cliente = document.getElementById("cliente").value;

    const mensagem = document.getElementById("mensagem");

    mensagem.textContent =
        `Pedido iniciado para o cliente ${cliente}.`;

    formulario.reset();
});