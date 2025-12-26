// Configuração Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyDE4rxt6EjDxHY510kwmg9dMCDBwZmAgCk",
    authDomain: "yakisame-b57b6.firebaseapp.com",
    projectId: "yakisame-b57b6",
    storageBucket: "yakisame-b57b6.firebasestorage.app",
    messagingSenderId: "421411319772",
    appId: "1:421411319772:web:0ba4d2ecaaa0aad69da919",
    measurementId: "G-YRKQ7S006F",
    databaseURL: "https://yakisame-b57b6-default-rtdb.firebaseio.com"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Carregar produtos por categoria
function carregarProdutos() {
    const produtosRef = ref(database, 'produtos');
    
    onValue(produtosRef, (snapshot) => {
        const produtos = snapshot.val();
        
        if (!produtos) return;

        // Organizar produtos por categoria
        const categorias = {
            notebooks: [],
            celulares: [],
            acessorios: [],
            games: []
        };

        Object.values(produtos).forEach(produto => {
            if (categorias[produto.categoria]) {
                categorias[produto.categoria].push(produto);
            }
        });

        // Renderizar produtos em cada categoria
        renderizarCategoria('notebooks', categorias.notebooks);
        renderizarCategoria('celulares', categorias.celulares);
        renderizarCategoria('acessorios', categorias.acessorios);
        renderizarCategoria('games', categorias.games);
    });
}

function renderizarCategoria(categoriaId, produtos) {
    const container = document.getElementById(`container-${categoriaId}`);
    if (!container || produtos.length === 0) return;

    produtos.forEach((produto, index) => {
        const produtoHTML = criarCardProduto(produto, index);
        container.insertAdjacentHTML('beforeend', produtoHTML);
    });
}

function criarCardProduto(produto, index) {
    const classeCaixa = `caixa-iten${(index % 5) + 1}`;
    
    return `
        <a href="${produto.link}" target="_blank" rel="noopener" class="${classeCaixa}">
            <img src="${produto.imagem}" alt="${produto.nome}">
            <h3>${produto.nome}</h3>
        </a>
    `;
}

// Carregar produtos quando a página carregar
document.addEventListener('DOMContentLoaded', carregarProdutos);
