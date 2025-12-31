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

// Carregar categorias dinâmicas
function carregarCategorias() {
    const categoriasRef = ref(database, 'categorias');
    
    onValue(categoriasRef, (snapshot) => {
        const categorias = snapshot.val();
        
        if (!categorias) return;

        renderizarContainersCategorias(categorias);
        
        Object.keys(categorias).forEach(categoriaId => {
            carregarProdutosDaCategoria(categoriaId, categorias[categoriaId]);
        });
    });
}

function renderizarContainersCategorias(categorias) {
    const mainContainer = document.querySelector('.produtos-container') || document.querySelector('main');
    if (!mainContainer) return;
    
    const sectionsAnteriores = mainContainer.querySelectorAll('section[id^="section-"]');
    sectionsAnteriores.forEach(section => section.remove());
    
    const categoriasOrdenadas = Object.entries(categorias).sort((a, b) => {
        return (a[1].ordem || 0) - (b[1].ordem || 0);
    });
    
    categoriasOrdenadas.forEach(([id, categoria]) => {
        const sectionHTML = `
            <section id="section-${id}">
                <h2 class="titulo-categoria">${categoria.nome}</h2>
                <div class="container-produtos" id="container-${id}"></div>
            </section>
        `;
        mainContainer.insertAdjacentHTML('beforeend', sectionHTML);
    });
}

function carregarProdutosDaCategoria(categoriaId, categoria) {
    const produtosRef = ref(database, `produtos/${categoriaId}`);
    
    onValue(produtosRef, (snapshot) => {
        const produtos = snapshot.val();
        const container = document.getElementById(`container-${categoriaId}`);
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!produtos) return;

        Object.values(produtos).forEach((produto, index) => {
            const produtoHTML = criarCardProduto(produto, index);
            container.insertAdjacentHTML('beforeend', produtoHTML);
        });
    });
}

function criarCardProduto(produto, index) {
    const classeCaixa = `caixa-iten${(index % 5) + 1}`;
    
    // Garante que a imagem existe
    if (!produto.imagem) {
        console.warn('Produto sem imagem:', produto.nome);
        return '';
    }
    
    return `
        <a href="${produto.link}" target="_blank" rel="noopener" class="${classeCaixa}">
            <img src="${produto.imagem}" alt="${produto.nome}" onerror="this.style.display='none'; console.error('Erro ao carregar imagem:', this.src);">
            <h3>${produto.nome}</h3>
        </a>
    `;
}

// Carregar produtos quando a página carregar
document.addEventListener('DOMContentLoaded', carregarCategorias);
