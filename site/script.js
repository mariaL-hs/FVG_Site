import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore, collection, getDocs,
    query, where, limit, startAfter, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─────────────────────────────────────────────
// CONFIGURAÇÃO
// ─────────────────────────────────────────────
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

const NUMERO_WHATSAPP = "5547984252056";
const PAGE_SIZE = 12;

const CATEGORIAS = {
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

// ─────────────────────────────────────────────
// ELEMENTOS DOM
// ─────────────────────────────────────────────
const el = {
    viewHome: document.getElementById("view-home"),
    viewLoja: document.getElementById("view-loja"),
    viewBusca: document.getElementById("view-busca"),
    listaProdutos: document.getElementById("lista-produtos"),
    listaBusca: document.getElementById("lista-busca"),
    contador: document.getElementById("contador-produtos"),
    tituloSidebar: document.getElementById("titulo-sidebar"),
    listaSubcategorias: document.getElementById("lista-subcategorias"),
    tituloSecao: document.getElementById("titulo-secao-produtos"),
    tituloBusca: document.getElementById("titulo-busca"),
    navbarCategorias: document.getElementById("navbar-categorias"),
    carouselCategorias: document.getElementById("carousel-categorias"),
    containerPromocoes: document.getElementById("container-promocoes"),
    listaPromocoes: document.getElementById("lista-promocoes"),
    listaHomePromocoes: document.getElementById("lista-home-promocoes"),
    listaHomeMaisVendidos: document.getElementById("lista-home-mais-vendidos"),
    barraPesquisa: document.getElementById("barra-pesquisa"),
    btnPesquisar: document.getElementById("btn-pesquisar"),
    btnCarregarMais: document.getElementById("btn-carregar-mais"),
    selectOrdenacao: document.getElementById("select-ordenacao"),
    breadcrumb: document.getElementById("breadcrumb"),
    breadcrumbCategoria: document.getElementById("breadcrumb-categoria"),
    breadcrumbSubWrap: document.getElementById("breadcrumb-sub-wrap"),
    breadcrumbSub: document.getElementById("breadcrumb-sub"),
    badgeCarrinho: document.getElementById("badge-carrinho"),
    overlayProduto: document.getElementById("overlay-produto"),
    overlayZoom: document.getElementById("overlay-zoom"),
    imgZoom: document.getElementById("img-zoom"),
    galeriaPrincipal: document.getElementById("galeria-img-principal"),
    galeriaThumbs: document.getElementById("galeria-thumbs"),
    modalNome: document.getElementById("modal-nome"),
    modalPreco: document.getElementById("modal-preco"),
    modalDescricao: document.getElementById("modal-descricao"),
    modalSubcategoria: document.getElementById("modal-subcategoria"),
    modalBtnCarrinho: document.getElementById("modal-btn-carrinho"),
};

// ─────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────
const estado = {
    categoriaAtual: null,
    subcategoriaAtual: null,
    ordenacao: "destaque",
    ultimoDoc: null,
    temMais: false,
    produtosNormais: [],    // buffer completo da categoria (para ordenação/paginação local)
    paginaAtual: 0,
    cache: new Map(),       // chave: "categoria|subcategoria" → array de produtos
};

// ─────────────────────────────────────────────
// CARRINHO
// ─────────────────────────────────────────────
let carrinho = JSON.parse(localStorage.getItem("fvg_carrinho") || "[]");

function salvarCarrinho() {
    localStorage.setItem("fvg_carrinho", JSON.stringify(carrinho));
}

function atualizarBadge() {
    const total = carrinho.length;
    el.badgeCarrinho.textContent = total;
    el.badgeCarrinho.classList.toggle("hidden", total === 0);
}

function adicionarAoCarrinho(produto) {
    carrinho.push({ nome: produto.nome, preco: produto.preco });
    salvarCarrinho();
    atualizarBadge();
    mostrarToast(`"${produto.nome}" adicionado ao carrinho!`);
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    salvarCarrinho();
    atualizarBadge();
    renderizarCarrinho();
}

window.limparCarrinho = () => {
    carrinho = [];
    salvarCarrinho();
    atualizarBadge();
    renderizarCarrinho();
};

function renderizarCarrinho() {
    const lista = document.getElementById("lista-carrinho");
    if (!lista) return;

    if (carrinho.length === 0) {
        lista.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full py-16 text-gray-400">
                <i class="fas fa-shopping-cart text-5xl mb-4 opacity-30"></i>
                <p class="text-lg font-medium">Carrinho vazio</p>
                <p class="text-sm mt-1">Adicione produtos para solicitar um orçamento</p>
            </div>`;
        return;
    }

    lista.innerHTML = carrinho.map((item, i) => `
        <div class="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
            <div class="flex-1 min-w-0 pr-3">
                <p class="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">${escapeHtml(item.nome)}</p>
                <p class="text-green-700 font-bold text-sm mt-1">${formatarPreco(item.preco)}</p>
            </div>
            <button onclick="removerDoCarrinho(${i})"
                class="flex-shrink-0 text-red-400 hover:text-red-600 transition w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50">
                <i class="fas fa-trash text-sm"></i>
            </button>
        </div>
    `).join("");
}

window.abrirCarrinho = () => {
    renderizarCarrinho();
    document.getElementById("overlay-carrinho").style.display = "block";
    document.getElementById("painel-carrinho").classList.add("aberto");
    document.body.style.overflow = "hidden";
};

window.fecharCarrinho = () => {
    document.getElementById("overlay-carrinho").style.display = "none";
    document.getElementById("painel-carrinho").classList.remove("aberto");
    document.body.style.overflow = "";
};

window.removerDoCarrinho = removerDoCarrinho;

window.solicitarOrcamento = () => {
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }
    const lista = carrinho.map((item, i) => `${i + 1}. ${item.nome} - ${formatarPreco(item.preco)}`).join("\n");
    const texto = encodeURIComponent(
        `Olá! Vim pelo site da FVG e gostaria de solicitar um orçamento:\n\n${lista}\n\nAguardo retorno!`
    );
    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${texto}`, "_blank");
};

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
function mostrarToast(msg) {
    const t = document.createElement("div");
    t.className = "fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-full text-sm shadow-xl z-[2000] animate-fade-in";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function formatarPreco(preco) {
    return preco != null
        ? Number(preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        : "R$ 0,00";
}

function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function obterImagemCapa(produto, placeholder = "https://placehold.co/400x300?text=Sem+Foto") {
    if (produto.imagemURL) return produto.imagemURL;

    if (!produto.imagens?.length) return placeholder;

    const capa = produto.imagens.find(i => i.capa) ?? produto.imagens[0];
    return capa.url;
}

function gerarLinkZap(nomeProduto) {
    const texto = encodeURIComponent(`Olá! Vim pelo site da FVG. Tenho interesse no produto: *${nomeProduto}*`);
    return `https://wa.me/${NUMERO_WHATSAPP}?text=${texto}`;
}

function ehPromocao(produto) {
    return produto.emPromocao === true || produto.emPromocao === "true";
}

function ordenarProdutos(lista, criterio) {
    const copia = [...lista];
    if (criterio === "menor") return copia.sort((a, b) => (a.preco ?? 0) - (b.preco ?? 0));
    if (criterio === "maior") return copia.sort((a, b) => (b.preco ?? 0) - (a.preco ?? 0));
    // destaque: destacados primeiro
    return copia.sort((a, b) => {
        const da = a.destaque ? 1 : 0;
        const db = b.destaque ? 1 : 0;
        return db - da;
    });
}

function chaveCache(categoria, subcategoria) {
    return `${categoria ?? ""}|${subcategoria ?? ""}`;
}

// ─────────────────────────────────────────────
// CARDS
// ─────────────────────────────────────────────
function criarCardProduto(produto, isPromo = false) {
    const img = obterImagemCapa(produto, isPromo
        ? "https://placehold.co/400x300?text=Oferta"
        : "https://placehold.co/400x300?text=Sem+Foto");
    const preco = formatarPreco(produto.preco);
    const nome = escapeHtml(produto.nome ?? "Produto");
    const subcategoria = escapeHtml(produto.subcategorias?.[0] ?? "Item");
    const temDesconto = ehPromocao(produto);

    const badgePromo = isPromo
        ? `<div class="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded z-10">OFERTA</div>`
        : "";

    const classeBorda = isPromo ? "border-2 border-red-200" : "border border-gray-100";
    const classePreco = temDesconto ? "preco-promo text-lg font-bold" : "text-lg font-bold text-gray-900";

    // Data-attr com JSON encodado para abrir modal
    const dadosAttr = `data-produto='${JSON.stringify({
        nome: produto.nome ?? "",
        preco: produto.preco ?? 0,
        descricao: produto.descricao ?? "",
        imagens: produto.imagens ?? [],
        subcategorias: produto.subcategorias ?? [],
        emPromocao: produto.emPromocao ?? false,
        destaque: produto.destaque ?? false,
    }).replace(/'/g, "&#39;")}'`;

    return `
        <div class="bg-white rounded-xl shadow-sm ${classeBorda} overflow-hidden hover:shadow-lg transition group card-produto cursor-pointer"
             ${dadosAttr}
             onclick="abrirProduto(this)">
            <div class="img-produto-wrapper relative">
                ${badgePromo}
                <img src="${img}" alt="${nome}" loading="lazy">
            </div>
            <div class="p-3">
                <p class="text-xs text-green-600 font-bold uppercase mb-1 truncate">${subcategoria}</p>
                <h3 class="font-bold text-gray-800 leading-tight mb-2 line-clamp-2 text-sm min-h-[2.5rem]">${nome}</h3>
                <div class="flex items-center justify-between mt-3">
                    <span class="${classePreco}">${preco}</span>
                    <button
                        onclick="event.stopPropagation(); adicionarAoCarrinhoById(this)"
                        data-nome="${nome}"
                        data-preco="${produto.preco ?? 0}"
                        class="bg-green-600 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-green-700 shadow-sm transition transform hover:scale-110 flex-shrink-0">
                        <i class="fas fa-cart-plus text-sm"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

window.adicionarAoCarrinhoById = (btn) => {
    adicionarAoCarrinho({ nome: btn.dataset.nome, preco: parseFloat(btn.dataset.preco) });
};

// ─────────────────────────────────────────────
// MODAL PRODUTO COMPLETO
// ─────────────────────────────────────────────
let produtoAtualModal = null;

window.abrirProduto = (cardEl) => {
    let dados;
    try {
        dados = JSON.parse(cardEl.getAttribute("data-produto").replace(/&#39;/g, "'"));
    } catch {
        return;
    }
    produtoAtualModal = dados;

    const temDesconto = dados.emPromocao === true || dados.emPromocao === "true";
    el.modalNome.textContent = dados.nome ?? "";
    el.modalDescricao.textContent = dados.descricao || "Sem descrição disponível.";
    el.modalSubcategoria.textContent = dados.subcategorias?.[0] ?? "";
    el.modalPreco.textContent = formatarPreco(dados.preco);
    el.modalPreco.className = temDesconto
        ? "text-3xl font-bold mb-6 preco-promo"
        : "text-3xl font-bold mb-6 text-gray-900";

    // Galeria
    const imagens = dados.imagens?.length ? dados.imagens : [];
    const capaIdx = imagens.findIndex(i => i.capa);
    const primeiraUrl = imagens.length
        ? (capaIdx >= 0 ? imagens[capaIdx].url : imagens[0].url)
        : "https://placehold.co/600x400?text=Sem+Foto";

    el.galeriaPrincipal.src = primeiraUrl;
    el.galeriaPrincipal.alt = dados.nome ?? "";

    el.galeriaThumbs.innerHTML = imagens.map((img, i) => `
        <img src="${img.url}" alt="Foto ${i + 1}" loading="lazy"
            class="w-16 h-16 object-cover rounded-lg cursor-pointer border-2 transition ${i === (capaIdx >= 0 ? capaIdx : 0) ? "border-green-500" : "border-transparent"} hover:border-green-400"
            onclick="selecionarThumb(this, '${img.url}')">
    `).join("");

    el.modalBtnCarrinho.onclick = () => {
        adicionarAoCarrinho({ nome: dados.nome, preco: dados.preco });
    };

    el.overlayProduto.classList.add("ativo");
    document.body.style.overflow = "hidden";
};

window.selecionarThumb = (thumbEl, url) => {
    el.galeriaPrincipal.src = url;
    el.galeriaThumbs.querySelectorAll("img").forEach(t => t.classList.remove("border-green-500"));
    thumbEl.classList.add("border-green-500");
};

window.fecharProduto = (e) => {
    if (e && e.target !== el.overlayProduto) return;
    el.overlayProduto.classList.remove("ativo");
    document.body.style.overflow = "";
    produtoAtualModal = null;
};

// Fechar com botão X dentro do modal
document.querySelector("#modal-produto .fa-times")?.closest("button")
    ?.addEventListener("click", () => {
        el.overlayProduto.classList.remove("ativo");
        document.body.style.overflow = "";
    });

// ─────────────────────────────────────────────
// ZOOM
// ─────────────────────────────────────────────
window.abrirZoom = (url) => {
    el.imgZoom.src = url;
    el.overlayZoom.classList.add("ativo");
    document.body.style.overflow = "hidden";
};

window.fecharZoom = () => {
    el.overlayZoom.classList.remove("ativo");
    el.imgZoom.src = "";
    document.body.style.overflow = "";
};

// Zoom também pode ser acionado clicando na imagem principal do modal
el.galeriaPrincipal?.addEventListener("click", () => {
    if (el.galeriaPrincipal.src) abrirZoom(el.galeriaPrincipal.src);
});

// ─────────────────────────────────────────────
// DRAG SCROLL
// ─────────────────────────────────────────────
function aplicarDragScroll(el) {
    if (!el) return;
    let isDown = false, startX, scrollLeft;

    el.addEventListener("mousedown", e => {
        isDown = true;
        el.classList.add("dragging");
        startX = e.pageX - el.offsetLeft;
        scrollLeft = el.scrollLeft;
    });
    el.addEventListener("mouseleave", () => { isDown = false; el.classList.remove("dragging"); });
    el.addEventListener("mouseup", () => { isDown = false; el.classList.remove("dragging"); });
    el.addEventListener("mousemove", e => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - el.offsetLeft;
        el.scrollLeft = scrollLeft - (x - startX) * 1.5;
    });

    // Touch
    let touchStartX, touchScrollLeft;
    el.addEventListener("touchstart", e => {
        touchStartX = e.touches[0].pageX;
        touchScrollLeft = el.scrollLeft;
    }, { passive: true });
    el.addEventListener("touchmove", e => {
        const dx = touchStartX - e.touches[0].pageX;
        el.scrollLeft = touchScrollLeft + dx;
    }, { passive: true });
}

// ─────────────────────────────────────────────
// LAYOUT INICIAL
// ─────────────────────────────────────────────
function inicializarNavbar() {
    if (!el.navbarCategorias) return;
    el.navbarCategorias.innerHTML = "";

    Object.entries(CATEGORIAS).forEach(([cat, subcats]) => {
        const temSub = subcats.length > 0;
        const dropdown = temSub ? `
            <div class="dropdown-menu absolute left-0 top-full bg-white shadow-xl border border-gray-100 rounded-b-lg w-56 z-50 py-2">
                ${subcats.map(sub => `
                    <a href="#" onclick="filtrarPorSubcategoria('${escapeHtml(cat)}', '${escapeHtml(sub)}'); event.preventDefault(); event.stopPropagation();"
                       class="block px-4 py-3 text-sm text-gray-600 hover:bg-gray-100 hover:text-black capitalize transition-colors">
                        ${escapeHtml(sub)}
                    </a>
                `).join("")}
            </div>` : "";

        el.navbarCategorias.innerHTML += `
            <div class="nav-item relative h-full flex items-center justify-center flex-shrink-0">
                <span class="hover:text-[oklch(55.4%_0.135_66.442)] font-medium uppercase text-sm md:text-base whitespace-nowrap px-4 md:px-6 cursor-pointer transition-colors h-full flex items-center tracking-wide"
                      onclick="abrirCategoria('${escapeHtml(cat)}')">
                    ${escapeHtml(cat)} ${temSub ? '<i class="fas fa-chevron-down text-[10px] ml-1 opacity-50"></i>' : ''}
                </span>
                ${dropdown}
            </div>
        `;
    });
}

function inicializarCarousel() {
    if (!el.carouselCategorias) return;
    el.carouselCategorias.innerHTML = "";

    Object.keys(CATEGORIAS).forEach(cat => {
        el.carouselCategorias.innerHTML += `
            <div onclick="abrirCategoria('${escapeHtml(cat)}')"
                 class="flex-shrink-0 w-56 h-36 bg-[oklch(55.4%_0.135_66.442)] rounded-lg relative cursor-pointer hover:opacity-90 transition transform hover:-translate-y-1 shadow-md group">
                <div class="absolute inset-0 bg-black bg-opacity-10 rounded-lg group-hover:bg-opacity-0 transition"></div>
                <div class="absolute inset-0 flex items-center justify-center p-4 text-center">
                    <h3 class="text-base font-bold text-white uppercase drop-shadow-sm break-words w-full">${escapeHtml(cat)}</h3>
                </div>
            </div>
        `;
    });
}

function inicializarScrollButtons() {
    const pares = [
        { containerId: "navbar-categorias", leftId: "nav-scroll-left", rightId: "nav-scroll-right", delta: 200 },
        { containerId: "carousel-categorias", leftId: "carousel-scroll-left", rightId: "carousel-scroll-right", delta: 300 },
    ];
    pares.forEach(({ containerId, leftId, rightId, delta }) => {
        const c = document.getElementById(containerId);
        document.getElementById(leftId)?.addEventListener("click", () => c?.scrollBy({ left: -delta, behavior: "smooth" }));
        document.getElementById(rightId)?.addEventListener("click", () => c?.scrollBy({ left: delta, behavior: "smooth" }));
    });
}

// ─────────────────────────────────────────────
// NAVEGAÇÃO
// ─────────────────────────────────────────────
function mostrarView(view) {
    el.viewHome.classList.toggle("hidden", view !== "home");
    el.viewHome.classList.toggle("block", view === "home");
    el.viewLoja.classList.toggle("hidden", view !== "loja");
    el.viewBusca.classList.toggle("hidden", view !== "busca");
    el.breadcrumb.classList.toggle("hidden", view === "home");
}

window.voltarParaHome = () => {
    mostrarView("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
};

window.abrirCategoria = (categoria) => {
    estado.categoriaAtual = categoria;
    estado.subcategoriaAtual = null;
    estado.paginaAtual = 0;
    estado.produtosNormais = [];

    mostrarView("loja");
    if (el.tituloSidebar) el.tituloSidebar.textContent = categoria;
    if (el.tituloSecao) el.tituloSecao.textContent = `Produtos em ${categoria}`;
    if (el.barraPesquisa) el.barraPesquisa.value = "";

    atualizarBreadcrumb(categoria, null);
    renderizarSidebar(categoria);
    carregarProdutos(categoria);
    window.scrollTo({ top: 0, behavior: "smooth" });
};

window.filtrarPorSubcategoria = (categoria, subcategoria) => {
    estado.categoriaAtual = categoria;
    estado.subcategoriaAtual = subcategoria;
    estado.paginaAtual = 0;
    estado.produtosNormais = [];

    mostrarView("loja");
    if (el.tituloSidebar) el.tituloSidebar.textContent = categoria;
    if (el.tituloSecao) el.tituloSecao.textContent = subcategoria;

    atualizarBreadcrumb(categoria, subcategoria);
    renderizarSidebar(categoria, subcategoria);
    carregarProdutos(categoria, subcategoria);
    window.scrollTo({ top: 0, behavior: "smooth" });
};

window.abrirMaisVendidos = () => {
    mostrarView("busca");
    if (el.tituloBusca) el.tituloBusca.textContent = "⭐ Mais Vendidos";
    if (el.listaBusca) el.listaBusca.innerHTML = `<div class="col-span-full text-center py-16"><i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i></div>`;
    carregarMaisVendidos(el.listaBusca);
    window.scrollTo({ top: 0, behavior: "smooth" });
};

// ─────────────────────────────────────────────
// BREADCRUMB
// ─────────────────────────────────────────────
function atualizarBreadcrumb(categoria, subcategoria) {
    if (el.breadcrumbCategoria) el.breadcrumbCategoria.textContent = categoria;
    if (subcategoria) {
        el.breadcrumbSubWrap.classList.remove("hidden");
        el.breadcrumbSub.textContent = subcategoria;
    } else {
        el.breadcrumbSubWrap?.classList.add("hidden");
    }
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
function renderizarSidebar(categoria, subcatSelecionada = null) {
    if (!el.listaSubcategorias) return;
    const subcats = CATEGORIAS[categoria] ?? [];

    const radioTodos = `
        <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 w-full">
            <input type="radio" name="filtroSub" value="todos" ${!subcatSelecionada ? "checked" : ""}
                   onchange="abrirCategoria('${escapeHtml(categoria)}')" class="form-radio text-green-700 h-5 w-5">
            <span class="text-base text-gray-700 font-medium">Ver Todos</span>
        </label>`;

    const radiosSub = subcats.map(sub => `
        <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 w-full">
            <input type="radio" name="filtroSub" value="${escapeHtml(sub)}" ${sub === subcatSelecionada ? "checked" : ""}
                   onchange="filtrarPorSubcategoria('${escapeHtml(categoria)}', '${escapeHtml(sub)}')" class="form-radio text-green-700 h-5 w-5">
            <span class="text-base text-gray-600 capitalize">${escapeHtml(sub)}</span>
        </label>
    `).join("");

    el.listaSubcategorias.innerHTML = radioTodos + radiosSub;
}

// ─────────────────────────────────────────────
// FIREBASE — CARREGAR PRODUTOS (com cache)
// ─────────────────────────────────────────────
async function buscarProdutosFirebase(categoria, subcategoria = null) {
    const chave = chaveCache(categoria, subcategoria);
    if (estado.cache.has(chave)) return estado.cache.get(chave);

    const q = query(
        collection(db, "produtos"),
        where("categorias", "array-contains", categoria)
    );
    const snapshot = await getDocs(q);

    const todos = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        if (subcategoria) {
            const subs = (data.subcategorias ?? []).map(s => s.toLowerCase());
            if (!subs.includes(subcategoria.toLowerCase())) return;
        }
        todos.push(data);
    });

    estado.cache.set(chave, todos);
    return todos;
}

async function carregarProdutos(categoria, subcategoria = null) {
    if (el.listaProdutos) {
        el.listaProdutos.innerHTML = `<div class="col-span-full text-center py-20"><i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i></div>`;
    }
    if (el.containerPromocoes) el.containerPromocoes.classList.add("hidden");
    if (el.btnCarregarMais) el.btnCarregarMais.classList.add("hidden");

    try {
        const todos = await buscarProdutosFirebase(categoria, subcategoria);

        const promocoes = todos.filter(p => ehPromocao(p));
        const normais = todos.filter(p => !ehPromocao(p));

        estado.produtosNormais = normais;
        estado.paginaAtual = 0;

        renderizarPromocoes(promocoes);
        renderizarPaginaAtual();

    } catch (error) {
        console.error("Erro Firebase:", error);
        const msgs = {
            "permission-denied": "Sem permissão no Firestore.",
            "failed-precondition": "Índice necessário não existe.",
        };
        if (el.listaProdutos) {
            el.listaProdutos.innerHTML = `<div class="col-span-full text-center text-red-500 py-10">${msgs[error.code] ?? "Erro ao carregar produtos."}</div>`;
        }
    }
}

function renderizarPaginaAtual(acumular = false) {
    const ordenados = ordenarProdutos(estado.produtosNormais, estado.ordenacao);
    const inicio = estado.paginaAtual * PAGE_SIZE;
    const pagina = ordenados.slice(inicio, inicio + PAGE_SIZE);
    const temMais = (inicio + PAGE_SIZE) < ordenados.length;

    if (el.contador) el.contador.textContent = `${ordenados.length} produtos`;

    if (!acumular) {
        if (el.listaProdutos) el.listaProdutos.innerHTML = "";
    }

    if (pagina.length === 0 && !acumular) {
        el.listaProdutos.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg">
                <i class="fas fa-box-open text-4xl text-gray-300 mb-3"></i>
                <p class="text-gray-500">Nenhum produto encontrado nesta categoria.</p>
            </div>`;
    } else {
        pagina.forEach(p => {
            el.listaProdutos.insertAdjacentHTML("beforeend", criarCardProduto(p, false));
        });
    }

    if (el.btnCarregarMais) {
        el.btnCarregarMais.classList.toggle("hidden", !temMais);
    }
}

// Botão "Carregar mais"
el.btnCarregarMais?.addEventListener("click", () => {
    estado.paginaAtual++;
    renderizarPaginaAtual(true);
    // scroll suave até novos cards
    setTimeout(() => {
        const cards = el.listaProdutos?.querySelectorAll(".card-produto");
        if (cards?.length) {
            const ultimoAntes = estado.paginaAtual * PAGE_SIZE;
            cards[ultimoAntes]?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, 100);
});

// Ordenação
el.selectOrdenacao?.addEventListener("change", () => {
    estado.ordenacao = el.selectOrdenacao.value;
    estado.paginaAtual = 0;
    renderizarPaginaAtual(false);
});

// ─────────────────────────────────────────────
// RENDERIZAR PROMOÇÕES (categoria)
// ─────────────────────────────────────────────
function renderizarPromocoes(lista) {
    if (!el.listaPromocoes || !el.containerPromocoes) return;
    if (!lista.length) {
        el.containerPromocoes.classList.add("hidden");
        return;
    }
    el.containerPromocoes.classList.remove("hidden");
    el.listaPromocoes.innerHTML = lista.map(p => criarCardProduto(p, true)).join("");
}

// ─────────────────────────────────────────────
// HOME — MAIS VENDIDOS + PROMOÇÕES
// ─────────────────────────────────────────────
async function carregarMaisVendidos(containerEl) {
    const alvo = containerEl ?? el.listaHomeMaisVendidos;
    if (!alvo) return;

    try {
        const q = query(collection(db, "produtos"), where("destaque", "==", true), limit(8));
        const snapshot = await getDocs(q);
        alvo.innerHTML = "";

        if (snapshot.empty) {
            alvo.innerHTML = `<div class="col-span-full text-center text-gray-400 py-4">Em breve os mais vendidos!</div>`;
            return;
        }
        snapshot.forEach(doc => {
            alvo.insertAdjacentHTML("beforeend", criarCardProduto(doc.data(), false));
        });
    } catch (e) {
        console.error("Erro mais vendidos:", e);
        alvo.innerHTML = `<div class="col-span-full text-center text-gray-400 py-4">Não foi possível carregar.</div>`;
    }
}

async function carregarPromocoesHome() {
    if (!el.listaHomePromocoes) return;
    try {
        const q = query(collection(db, "produtos"), where("emPromocao", "==", true), limit(8));
        const snapshot = await getDocs(q);
        el.listaHomePromocoes.innerHTML = "";

        if (snapshot.empty) {
            el.listaHomePromocoes.innerHTML = `<div class="col-span-full text-center text-gray-400 py-4">Confira nossas ofertas em breve!</div>`;
            return;
        }
        snapshot.forEach(doc => {
            el.listaHomePromocoes.insertAdjacentHTML("beforeend", criarCardProduto(doc.data(), true));
        });
    } catch (e) {
        console.error("Erro promoções home:", e);
    }
}

// ─────────────────────────────────────────────
// BUSCA GLOBAL
// ─────────────────────────────────────────────
async function executarBuscaGlobal(termo) {
    if (!termo.trim()) return;

    mostrarView("busca");
    if (el.tituloBusca) el.tituloBusca.textContent = `Resultados para "${termo}"`;
    if (el.listaBusca) el.listaBusca.innerHTML = `<div class="col-span-full text-center py-16"><i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i></div>`;

    try {
        const snapshot = await getDocs(collection(db, "produtos"));
        const termoLower = termo.toLowerCase();
        const resultados = [];

        snapshot.forEach(doc => {
            const d = doc.data();
            const campos = [
                d.nome ?? "",
                ...(d.categorias ?? []),
                ...(d.subcategorias ?? []),
                d.descricao ?? "",
            ].join(" ").toLowerCase();

            if (campos.includes(termoLower)) resultados.push(d);
        });

        if (el.listaBusca) {
            if (!resultados.length) {
                el.listaBusca.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                        <i class="fas fa-search text-5xl mb-4 opacity-30"></i>
                        <p class="text-lg">Nenhum produto encontrado para "<strong>${escapeHtml(termo)}</strong>"</p>
                    </div>`;
            } else {
                el.listaBusca.innerHTML = resultados.map(p => criarCardProduto(p, ehPromocao(p))).join("");
                if (el.tituloBusca) el.tituloBusca.textContent = `${resultados.length} resultados para "${termo}"`;
            }
        }
    } catch (e) {
        console.error("Erro busca:", e);
    }
}

el.btnPesquisar?.addEventListener("click", () => {
    executarBuscaGlobal(el.barraPesquisa?.value ?? "");
});

el.barraPesquisa?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") executarBuscaGlobal(el.barraPesquisa.value);
});

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    inicializarNavbar();
    inicializarCarousel();
    inicializarScrollButtons();
    aplicarDragScroll(el.navbarCategorias);
    aplicarDragScroll(el.carouselCategorias);
    carregarMaisVendidos();
    carregarPromocoesHome();
    atualizarBadge();
});