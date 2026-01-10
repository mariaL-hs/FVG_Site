import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

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
const auth = getAuth(app);
const storage = getStorage(app);

// --- DADOS ---
const dadosCategorias = {
    "Bobina": ["Bobina Térmica", "Bobina Plástica", "Bobina Oferta"],
    "Etiqueta": ["Etiqueta De Balança", "Personalizada", "Neutra", "Mx", "Gôndola", "Etiquetadora", "Etiqueta De Impressora", "Couché", "Etiqueta E Rótulo Personalizado"],
    "Senha": [],
    "Embalagem": ["Saco De Lixo"],
    "Sacola": ["Branca Milheiro", "Verde Fardo"],
    "Calçado": [],
    "Uniforme": ["Touca", "Bandana", "Boné", "Luva", "Jaleco", "Avental", "Japona", "Bata", "Calça", "Camiseta", "Moletom"],
    "Uniforme Personalizado": [],
    "Cartaz": ["Oferta", "Amarelo Liso", "Padaria", "Feira", "Carne", "Splash", "Impressora", "Diverso", "Outro (Canetão, Kit Metiq, Tinta)"],
    "Suprimento Para Açougue": ["Faca", "Chaira", "Pedra", "Suporte Para Pedra"],
    "Relógio Ponto": []
};

// Elementos
const form = document.getElementById("formCadastro");
const tabelaBody = document.querySelector("#tabelaProdutos tbody");
const editIdInput = document.getElementById("editId");
const btnSalvar = document.getElementById("btnSalvar");
const btnCancelar = document.getElementById("btnCancelar");
const containerCheckboxes = document.getElementById("container-checkboxes");
const imagemInput = document.getElementById("imagemInput");
const urlImagemSalva = document.getElementById("urlImagemSalva");
const previewImagem = document.getElementById("previewImagem");

const telaLogin = document.getElementById("tela-login");
const conteudoRestrito = document.getElementById("conteudo-restrito");
const btnEntrar = document.getElementById("btnEntrar");
const btnSair = document.getElementById("btnSair");
const loginEmail = document.getElementById("loginEmail");
const loginSenha = document.getElementById("loginSenha");

// --- 1. LOGIN ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        telaLogin.style.display = "none";
        conteudoRestrito.style.display = "block";
        gerarFormularioCategorias();
        carregarProdutos();
    } else {
        telaLogin.style.display = "flex";
        conteudoRestrito.style.display = "none";
    }
});

btnEntrar.addEventListener("click", () => {
    const email = loginEmail.value;
    const senha = loginSenha.value;
    btnEntrar.innerText = "Entrando...";
    
    signInWithEmailAndPassword(auth, email, senha)
        .then(() => {
            loginEmail.value = "";
            loginSenha.value = "";
            btnEntrar.innerText = "Entrar no Sistema";
        })
        .catch((error) => {
            alert("Erro ao entrar: " + error.message);
            btnEntrar.innerText = "Entrar no Sistema";
        });
});

btnSair.addEventListener("click", () => {
    signOut(auth).then(() => window.location.reload());
});

// --- 2. GESTÃO ---
function gerarFormularioCategorias() {
    containerCheckboxes.innerHTML = "";
    Object.keys(dadosCategorias).forEach(cat => {
        const grupo = document.createElement("div");
        grupo.className = "grupo-categoria";
        grupo.innerHTML = `
            <div class="cabecalho-categoria">
                <input type="checkbox" id="cat-${cat}" class="cat-check" value="${cat}">
                <label for="cat-${cat}">${cat}</label>
            </div>
        `;
        
        const subs = dadosCategorias[cat];
        if (subs.length > 0) {
            const listaSubs = document.createElement("div");
            listaSubs.className = "lista-subcategorias";
            subs.forEach(sub => {
                const idSub = `sub-${sub.replace(/[^a-zA-Z0-9]/g, '')}`; 
                listaSubs.innerHTML += `
                    <div class="item-sub">
                        <input type="checkbox" id="${idSub}" class="sub-check" value="${sub}">
                        <label for="${idSub}">${sub}</label>
                    </div>
                `;
            });
            grupo.appendChild(listaSubs);
        }
        containerCheckboxes.appendChild(grupo);
    });
}

function carregarProdutos() {
    if (!auth.currentUser) return;

    onSnapshot(collection(db, "produtos"), (snapshot) => {
        tabelaBody.innerHTML = "";
        const produtos = [];
        snapshot.forEach((doc) => produtos.push({ ...doc.data(), id: doc.id }));
        produtos.reverse();

        produtos.forEach((produto) => {
            const tr = document.createElement("tr");
            const isPromo = (produto.emPromocao === true || produto.emPromocao === "true");
            const textoPromo = isPromo 
                ? '<span style="color:white; background:red; padding:3px 8px; border-radius:10px; font-size:12px; font-weight:bold;">SIM</span>' 
                : '<span style="color:#aaa;">Não</span>';

            const preco = parseFloat(produto.preco).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
            const catsDisplay = [...(produto.categorias || []), ...(produto.subcategorias || [])].join(", ");
            const thumb = produto.imagemURL ? `<img src="${produto.imagemURL}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">` : '';

            tr.innerHTML = `
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        ${thumb}
                        <strong>${produto.nome}</strong>
                    </div>
                </td>
                <td>${preco}</td>
                <td><small>${catsDisplay}</small></td>
                <td style="text-align:center;">${textoPromo}</td>
                <td class="col-acoes">
                    <div class="acoes-wrapper">
                        <button class="btn-action btn-edit" data-id="${produto.id}">Editar</button>
                        <button class="btn-action btn-delete" data-id="${produto.id}">Excluir</button>
                    </div>
                </td>
            `;
            tabelaBody.appendChild(tr);
        });

        document.querySelectorAll(".btn-edit").forEach(btn => 
            btn.addEventListener("click", (e) => prepararEdicao(e.target.dataset.id))
        );
        document.querySelectorAll(".btn-delete").forEach(btn => 
            btn.addEventListener("click", (e) => deletarProduto(e.target.dataset.id))
        );
    });
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const btnOriginalText = btnSalvar.textContent;
    btnSalvar.textContent = "Salvando...";
    btnSalvar.disabled = true;

    try {
        const nome = document.getElementById("nomeProduto").value;
        const preco = parseFloat(document.getElementById("preco").value);
        const descricao = document.getElementById("descricao").value;
        const emPromocao = document.getElementById("emPromocao").checked;
        
        let urlFinal = urlImagemSalva.value;
        const arquivo = imagemInput.files[0];

        if (arquivo) {
            btnSalvar.textContent = "Subindo foto...";
            const nomeArquivo = `produtos/${Date.now()}_${arquivo.name}`;
            const storageRef = ref(storage, nomeArquivo);
            await uploadBytes(storageRef, arquivo);
            urlFinal = await getDownloadURL(storageRef);
        }

        const categorias = [];
        document.querySelectorAll(".cat-check:checked").forEach(cb => categorias.push(cb.value));
        const subcategorias = [];
        document.querySelectorAll(".sub-check:checked").forEach(cb => subcategorias.push(cb.value));

        const produtoData = {
            nome, preco, descricao, emPromocao, 
            imagemURL: urlFinal, categorias, subcategorias, atualizadoEm: new Date()
        };

        const idParaEditar = editIdInput.value;
        if (idParaEditar) {
            await updateDoc(doc(db, "produtos", idParaEditar), produtoData);
            alert("Produto atualizado!");
            cancelarEdicao();
        } else {
            produtoData.criadoEm = new Date();
            await addDoc(collection(db, "produtos"), produtoData);
            alert("Produto cadastrado!");
            form.reset();
            limparCheckboxes();
            urlImagemSalva.value = "";
            previewImagem.style.display = "none";
        }
    } catch (error) {
        console.error(error);
        alert("Erro: " + error.message);
    } finally {
        btnSalvar.textContent = btnOriginalText;
        btnSalvar.disabled = false;
    }
});

async function deletarProduto(id) {
    if (confirm("Tem certeza?")) {
        try {
            await deleteDoc(doc(db, "produtos", id));
        } catch (error) {
            alert("Erro: " + error.message);
        }
    }
}

async function prepararEdicao(id) {
    const { getDoc } = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js");
    const docSnap = await getDoc(doc(db, "produtos", id));
    
    if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById("nomeProduto").value = data.nome;
        document.getElementById("preco").value = data.preco;
        document.getElementById("descricao").value = data.descricao || "";
        document.getElementById("emPromocao").checked = (data.emPromocao === true || data.emPromocao === "true");
        
        urlImagemSalva.value = data.imagemURL || "";
        if (data.imagemURL) {
            previewImagem.src = data.imagemURL;
            previewImagem.style.display = "block";
        } else {
            previewImagem.style.display = "none";
        }
        
        limparCheckboxes();

        if (data.categorias) data.categorias.forEach(val => {
            const el = document.querySelector(`.cat-check[value="${val}"]`);
            if (el) el.checked = true;
        });
        
        if (data.subcategorias) data.subcategorias.forEach(val => {
            const el = document.querySelector(`.sub-check[value="${val}"]`);
            if (el) el.checked = true;
        });

        editIdInput.value = id;
        btnSalvar.textContent = "Atualizar Produto";
        btnSalvar.style.backgroundColor = "#eab308";
        btnCancelar.style.display = "inline-block";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function cancelarEdicao() {
    editIdInput.value = "";
    form.reset();
    limparCheckboxes();
    imagemInput.value = "";
    urlImagemSalva.value = "";
    previewImagem.style.display = "none";
    btnSalvar.textContent = "Salvar Produto";
    btnSalvar.style.backgroundColor = "#0c3d15";
    btnCancelar.style.display = "none";
}

function limparCheckboxes() {
    document.querySelectorAll('.cat-check, .sub-check').forEach(cb => cb.checked = false);
}

btnCancelar.addEventListener("click", cancelarEdicao);