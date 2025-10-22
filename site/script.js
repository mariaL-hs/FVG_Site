import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBg-TYQ9hQ_l_tDAMjOkmWn-WZhtNpa_oE",
    authDomain: "site-fgv.firebaseapp.com",
    projectId: "site-fgv",
    storageBucket: "site-fgv.appspot.com",
    messagingSenderId: "822205769832",
    appId: "1:822205769832:web:a8ecc16a5c8a3ff8c233dd",
    measurementId: "G-74MX0M7E8L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


//Função para buscar produtos no Firebase e exibir na tela
async function carregarProdutos() {
    const container = document.getElementById("produtos-container");
    if (!container) {
        console.error("Erro: Container de produtos não encontrado.");
        return;
    }

    // Define a consulta: Buscar na coleção 'produtos'
    const produtosRef = collection(db, "produtos");
    const q = query(produtosRef, where("categorias", "array-contains", "suprimentos"), limit(8));

    try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = "<p class='col-span-full text-gray-600'>Nenhuma promoção no momento.</p>";
            return;
        }

        container.innerHTML = "";

        querySnapshot.forEach((doc) => {
            const produto = doc.data();
            const produtoId = doc.id;
            const precoFormatado = produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            const cardHTML = `
      <div class="border rounded-lg shadow-lg overflow-hidden bg-white flex flex-col" data-id="${produtoId}">
          <img src="${produto.imagemURL || 'https://via.placeholder.com/400x300?text=Sem+Imagem'}" alt="${produto.nome}" class="w-full h-48 object-cover">
          
          <div class="p-4 flex flex-col flex-grow">
              <h3 class="font-bold text-lg truncate" title="${produto.nome}">${produto.nome}</h3>
              <p class="text-sm text-gray-600 mb-2 h-10 overflow-hidden">${produto.descricao || 'Sem descrição'}</p>
              
              <div class="mt-auto">
                <p class="text-xl font-semibold text-gray-900">${precoFormatado}</p>
                <button class="mt-3 w-full bg-[oklch(40.5%_0.101_131.063)] text-white py-2 rounded hover:bg-green-800 transition-colors">
                    Ver detalhes
                </button>
              </div>
          </div>
      </div>
      `;

            container.innerHTML += cardHTML;
        });

    } catch (error) {
        console.error("Erro ao buscar produtos: ", error);
        container.innerHTML = "<p class='col-span-full text-red-600'>Erro ao carregar produtos. Tente mais tarde.</p>";
    }
}

// Roda os scripts quando o HTML estiver pronto
document.addEventListener("DOMContentLoaded", () => {

    const toggleButton = document.getElementById("categoria-toggle-button");
    const menu = document.getElementById("categoria-menu");

    if (toggleButton && menu) {
        toggleButton.addEventListener("click", () => {
            menu.classList.toggle("hidden");
            menu.classList.toggle("flex");
        });
    }

    // Carrossel das categorias
    const swiper = new Swiper(".mySwiper", {
        slidesPerView: 1,
        spaceBetween: 20,
        loop: true,

        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },

        // Breakpoints para responsividade
        breakpoints: {
            // >= 768px (telas md do Tailwind)
            768: {
                slidesPerView: 2,
                spaceBetween: 20
            },
            // >= 1024px (telas lg do Tailwind)
            1024: {
                slidesPerView: 3,
                spaceBetween: 30
            }
        }
    });

    // Inicia a busca pelos produtos do Firebase
    carregarProdutos();

});