import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBg-TYQ9hQ_l_tDAMjOkmWn-WZhtNpa_oE",
    authDomain: "site-fgv.firebaseapp.com",
    projectId: "site-fgv",
    storageBucket: "site-fgv.firebasestorage.app",
    messagingSenderId: "822205769832",
    appId: "1:822205769832:web:a8ecc16a5c8a3ff8c233dd",
    measurementId: "G-74MX0M7E8L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- navbar ---
const dadosCategorias = {
    "Bobinas": ["Bobinas Térmicas", "Bobinas Plásticas", "Bobinas Oferta"],
    "Etiquetas": ["Etiquetas De Balança", "Personalizada", "Neutra", "Mx", "Gôndola", "Etiquetadoras", "Etiquetas De Impressora", "Couché", "Etiquetas E Rótulos Personalizado"],
    "Senhas": [],
    "Embalagens": ["Saco De Lixo"],
    "Sacolas": ["Branca Milheiro", "Verde Fardo"],
    "Calçados": [],
    "Uniformes": ["Toucas", "Bandanas", "Bonés", "Luvas", "Jalecos", "Aventais", "Japonas", "Batas", "Calças", "Camisetas", "Moletons"],
    "Uniformes Personalizados": [],
    "Cartazes": ["Oferta", "Amarelo Liso", "Padaria", "Feira", "Carne", "Splash", "Impressora", "Diverso", "Outro (Canetão, Kit Metiq, Tinta)"],
    "Suprimentos Para Açougue": ["Faca", "Chaira", "Pedra", "Suporte Para Pedra"],
    "Relógios Ponto": []
};

// --- ELEMENTOS ---
const viewHome = document.getElementById("view-home");
const viewLoja = document.getElementById("view-loja");
const listaProdutosEl = document.getElementById("lista-produtos");
const contadorEl = document.getElementById("contador-produtos");
const tituloSidebarEl = document.getElementById("titulo-sidebar");
const listaSubcategoriasEl = document.getElementById("lista-subcategorias");
const tituloSecaoEl = document.getElementById("titulo-secao-produtos");
const navbarCategoriasEl = document.getElementById("navbar-categorias");
const carouselCategoriasEl = document.getElementById("carousel-categorias");
const containerPromocoesEl = document.getElementById("container-promocoes");
const listaPromocoesEl = document.getElementById("lista-promocoes");
const barraPesquisa = document.getElementById("barra-pesquisa");

// --- CONFIG WHATSAPP ---
const NUMERO_WHATSAPP = "5547984252056"; 

// --- INICIALIZAÇÃO ---
function inicializarLayout() {
    const corLaranjaMarca = "text-[oklch(55.4%_0.135_66.442)]"; 
    const corFundoLaranja = "bg-[oklch(55.4%_0.135_66.442)]";

    // NAVBAR
    if(navbarCategoriasEl) {
        navbarCategoriasEl.innerHTML = "";
        Object.keys(dadosCategorias).forEach(cat => {
            const subcats = dadosCategorias[cat];
            const temSub = subcats.length > 0;
            
            const html = `
                <div class="relative group h-full flex items-center justify-center flex-shrink-0">
                    <span class="hover:${corLaranjaMarca} font-medium uppercase text-sm md:text-base whitespace-nowrap px-4 md:px-6 cursor-pointer transition-colors h-full flex items-center tracking-wide" onclick="abrirCategoria('${cat}')">
                        ${cat} ${temSub ? '<i class="fas fa-chevron-down text-[10px] ml-1 opacity-50"></i>' : ''}
                    </span>
                    ${temSub ? `
                    <div class="dropdown-menu absolute left-0 top-full bg-white shadow-xl border border-gray-100 rounded-b-lg w-56 z-50 py-2 hidden group-hover:block">
                        ${subcats.map(sub => `
                            <a href="#" onclick="filtrarPorSubcategoria('${cat}', '${sub}'); event.stopPropagation();" class="block px-4 py-3 text-sm text-gray-600 hover:bg-gray-100 hover:text-black capitalize transition-colors">
                                ${sub}
                            </a>
                        `).join('')}
                    </div>` : ''}
                </div>
            `;
            navbarCategoriasEl.innerHTML += html;
        });
    }

    // CARROSSEL
    if(carouselCategoriasEl) {
        carouselCategoriasEl.innerHTML = "";
        Object.keys(dadosCategorias).forEach(cat => {
            const html = `
                <div onclick="abrirCategoria('${cat}')" class="flex-shrink-0 w-64 h-40 ${corFundoLaranja} rounded-lg relative cursor-pointer hover:opacity-90 transition transform hover:-translate-y-1 shadow-md group">
                    <div class="absolute inset-0 bg-black bg-opacity-10 rounded-lg group-hover:bg-opacity-0 transition"></div>
                    <div class="absolute inset-0 flex items-center justify-center p-4 text-center">
                        <h3 class="text-xl font-bold text-white uppercase drop-shadow-sm break-words w-full">${cat}</h3>
                    </div>
                </div>
            `;
            carouselCategoriasEl.innerHTML += html;
        });
    }
}

// --- NAVEGAÇÃO ---
window.voltarParaHome = () => {
    viewLoja.classList.add("hidden");
    viewHome.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.abrirCategoria = (categoria) => {
    viewHome.classList.add("hidden");
    viewLoja.classList.remove("hidden");
    
    if(tituloSidebarEl) tituloSidebarEl.innerText = categoria;
    if(tituloSecaoEl) tituloSecaoEl.innerText = `Produtos em ${categoria}`;
    
    if(barraPesquisa) barraPesquisa.value = "";
    
    if(listaSubcategoriasEl) {
        listaSubcategoriasEl.innerHTML = `
            <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 w-full">
                <input type="radio" name="filtroSub" value="todos" checked onchange="carregarProdutosFirebase('${categoria}')" class="form-radio text-black h-5 w-5 focus:ring-black">
                <span class="text-base text-gray-700 font-medium">Ver Todos</span>
            </label>
        `;
        
        const subs = dadosCategorias[categoria] || [];
        subs.forEach(sub => {
            const idUnico = sub.replace(/\s+/g, '-').toLowerCase();
            const html = `
                 <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 w-full">
                    <input type="radio" id="radio-${idUnico}" name="filtroSub" value="${sub}" onchange="filtrarPorSubcategoria('${categoria}', '${sub}')" class="form-radio text-black h-5 w-5 focus:ring-black">
                    <span class="text-base text-gray-600 capitalize">${sub}</span>
                </label>
            `;
            listaSubcategoriasEl.innerHTML += html;
        });
    }

    carregarProdutosFirebase(categoria);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.filtrarPorSubcategoria = (categoria, subcategoria) => {
    if (viewLoja.classList.contains("hidden")) {
        window.abrirCategoria(categoria);
        setTimeout(() => {
            const radio = document.querySelector(`input[name="filtroSub"][value="${subcategoria}"]`);
            if(radio) radio.checked = true;
        }, 100);
    }
    if(tituloSecaoEl) tituloSecaoEl.innerText = `${subcategoria}`;
    carregarProdutosFirebase(categoria, subcategoria);
};

// --- PESQUISA EM TEMPO REAL ---
if(barraPesquisa) {
    barraPesquisa.addEventListener("input", (e) => {
        const termo = e.target.value.toLowerCase();
        const cards = listaProdutosEl.querySelectorAll(".card-produto");
        let visiveis = 0;

        cards.forEach(card => {
            const nome = card.getAttribute("data-nome").toLowerCase();
            if(nome.includes(termo)) {
                card.style.display = "block";
                visiveis++;
            } else {
                card.style.display = "none";
            }
        });
        if(contadorEl) contadorEl.innerText = `${visiveis} produtos encontrados`;
    });
}

// --- FIREBASE ---
window.carregarProdutosFirebase = async function(categoriaPrincipal, subcategoriaFiltro = null) {
    if (listaProdutosEl) {
        listaProdutosEl.innerHTML = `<div class="col-span-full text-center py-20"><i class="fas fa-spinner fa-spin text-4xl text-gray-800"></i></div>`;
    }
    
    if (containerPromocoesEl) {
        containerPromocoesEl.classList.add("hidden");
    }

    try {
        const produtosRef = collection(db, "produtos");
        const q = query(produtosRef, where("categorias", "array-contains", categoriaPrincipal));
        const querySnapshot = await getDocs(q);
        
        const produtosNormais = [];
        const produtosPromocao = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let passarFiltro = true;

            if (subcategoriaFiltro) {
                const subsDoProduto = (data.subcategorias || []).map(s => s.toLowerCase());
                if (!subsDoProduto.includes(subcategoriaFiltro.toLowerCase())) {
                    passarFiltro = false;
                }
            }

            if (passarFiltro) {
                if (data.emPromocao === true || data.emPromocao === "true") {
                    produtosPromocao.push(data);
                } else {
                    produtosNormais.push(data);
                }
            }
        });

        renderizarPromocoes(produtosPromocao);
        renderizarGrid(produtosNormais);

    } catch (error) {
        console.error("Erro completo:", error);
        if(listaProdutosEl) {
            listaProdutosEl.innerHTML = `<p class="col-span-full text-center text-red-500">Erro de permissão: Verifique as "Restrições de API" no Google Cloud Console.</p>`;
        }
    }
}

// --- FUNÇÃO AUXILIAR: LINK WHATSAPP ---
function gerarLinkZap(nomeProduto) {
    const texto = encodeURIComponent(`Olá! Vim pelo site da FVG. Tenho interesse no produto: *${nomeProduto}*`);
    return `https://wa.me/${NUMERO_WHATSAPP}?text=${texto}`;
}

function renderizarPromocoes(lista) {
    if (!listaPromocoesEl || !containerPromocoesEl) return;
    listaPromocoesEl.innerHTML = "";
    
    if (lista.length > 0) {
        containerPromocoesEl.classList.remove("hidden");
        lista.forEach(produto => {
            const preco = produto.preco ? produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
            const img = produto.imagemURL || "https://placehold.co/300x200?text=Oferta";
            const linkZap = gerarLinkZap(produto.nome);
            
            const html = `
                <div class="bg-white rounded-lg shadow-md border-2 border-red-200 overflow-hidden relative group card-produto" data-nome="${produto.nome}">
                    <div class="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10">OFERTA</div>
                    <div class="h-40 relative overflow-hidden bg-gray-50">
                        <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="${produto.nome}">
                    </div>
                    <div class="p-4">
                        <h3 class="font-bold text-gray-800 leading-tight mb-2 line-clamp-2 text-sm">${produto.nome}</h3>
                        <div class="flex items-center justify-between mt-2">
                            <span class="text-lg font-bold text-red-600">${preco}</span>
                            <a href="${linkZap}" target="_blank" class="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-700 shadow-md transition">
                                <i class="fas fa-comment-dots text-xs"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            listaPromocoesEl.innerHTML += html;
        });
    } else {
        containerPromocoesEl.classList.add("hidden");
    }
}

function renderizarGrid(lista) {
    if(!listaProdutosEl) return;
    listaProdutosEl.innerHTML = "";
    if(contadorEl) contadorEl.innerText = `${lista.length} produtos`;

    if (lista.length === 0) {
        listaProdutosEl.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg"><i class="fas fa-box-open text-4xl text-gray-300 mb-3"></i><p class="text-gray-500">Nenhum produto encontrado nesta categoria.</p></div>`;
        return;
    }

    lista.forEach(produto => {
        const preco = produto.preco ? produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
        const img = produto.imagemURL || "https://placehold.co/300x200?text=Sem+Foto";
        const linkZap = gerarLinkZap(produto.nome);
        const subcategoria = produto.subcategorias && produto.subcategorias.length > 0 ? produto.subcategorias[0] : 'Item';

        listaProdutosEl.innerHTML += `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition group card-produto" data-nome="${produto.nome}">
                <div class="h-48 relative overflow-hidden bg-gray-50">
                    <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="${produto.nome}">
                </div>
                <div class="p-4">
                    <p class="text-xs text-green-600 font-bold uppercase mb-1">${subcategoria}</p>
                    <h3 class="font-bold text-gray-800 leading-tight mb-2 line-clamp-2 text-sm">${produto.nome}</h3>
                    <div class="flex items-center justify-between mt-4">
                        <span class="text-lg font-bold text-gray-900">${preco}</span>
                        <a href="${linkZap}" target="_blank" class="bg-green-600 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-green-700 shadow-sm transition transform hover:scale-110">
                            <i class="fas fa-shopping-cart text-sm"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    });
}

async function carregarPromocoesHome() {
    const listaHome = document.getElementById("lista-home-promocoes");
    if(!listaHome) return;

    try {
        const produtosRef = collection(db, "produtos");
        const q = query(produtosRef, where("emPromocao", "==", true), limit(8));
        const snapshot = await getDocs(q);
        
        listaHome.innerHTML = "";
        
        if(snapshot.empty) {
            listaHome.innerHTML = `<div class="col-span-full text-center text-gray-400 py-4">Confira nossas ofertas em breve!</div>`;
            return;
        }

        snapshot.forEach(doc => {
            const produto = doc.data();
            const preco = produto.preco ? produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
            const img = produto.imagemURL || "https://placehold.co/300x200?text=Oferta";
            const linkZap = gerarLinkZap(produto.nome);

            const html = `
                <div class="bg-white rounded-lg shadow-md border border-red-100 overflow-hidden relative group hover:shadow-xl transition">
                    <div class="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10 uppercase tracking-wider">Oferta</div>
                    <div class="h-48 relative overflow-hidden bg-gray-50">
                        <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="${produto.nome}">
                    </div>
                    <div class="p-4">
                        <h3 class="font-bold text-gray-800 leading-tight mb-2 line-clamp-2 h-10">${produto.nome}</h3>
                        <div class="flex items-center justify-between mt-4">
                            <span class="text-xl font-bold text-red-600">${preco}</span>
                            <a href="${linkZap}" target="_blank" class="bg-red-600 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-700 shadow-sm transition transform hover:scale-110">
                                <i class="fas fa-shopping-cart text-sm"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            listaHome.innerHTML += html;
        });

    } catch (e) { console.error("Erro Home:", e); }
}

document.addEventListener("DOMContentLoaded", () => {
    inicializarLayout();
    carregarPromocoesHome();
    
    const navContainer = document.getElementById('navbar-categorias');
    if(navContainer) {
        const btnLeft = document.getElementById('nav-scroll-left');
        const btnRight = document.getElementById('nav-scroll-right');
        if(btnLeft) btnLeft.addEventListener('click', () => navContainer.scrollBy({ left: -200, behavior: 'smooth' }));
        if(btnRight) btnRight.addEventListener('click', () => navContainer.scrollBy({ left: 200, behavior: 'smooth' }));
    }

    const carouselContainer = document.getElementById('carousel-categorias');
    if(carouselContainer) {
        const btnLeft = document.getElementById('carousel-scroll-left');
        const btnRight = document.getElementById('carousel-scroll-right');
        if(btnLeft) btnLeft.addEventListener('click', () => carouselContainer.scrollBy({ left: -300, behavior: 'smooth' }));
        if(btnRight) btnRight.addEventListener('click', () => carouselContainer.scrollBy({ left: 300, behavior: 'smooth' }));
    }

    window.abrirStatusPedido = () => {
        const texto = encodeURIComponent("Olá! Gostaria de saber o status do meu pedido...");
        window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${texto}`, '_blank');
    };
});