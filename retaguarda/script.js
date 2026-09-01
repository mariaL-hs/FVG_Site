import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// ========================= FIREBASE CONFIG =========================
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

// ========================= CATEGORIAS =========================
const dadosCategorias = {
  "Bobinas": ["Bobinas Térmicas", "Bobinas Plásticas", "Bobinas Oferta"],
  "Etiquetas": ["Etiquetas De Balança", "Personalizada", "Neutra", "Mx", "Gôndola", "Etiquetadoras", "Etiquetas De Impressora", "Couché", "Etiquetas E Rótulo Personalizado"],
  "Calçados": [],
  "Uniformes": ["Toucas", "Bandanas", "Bonés", "Luvas", "Jalecos", "Aventais", "Japonas", "Batas", "Calças", "Camisetas", "Moletons"],
  "Uniformes Personalizados": [],
  "Suprimentos Para Açougue": ["Faca", "Chaira", "Pedra", "Suporte Para Pedra"],
};

// ========================= STATE =========================
let imagensTemp = [];
let lightboxIndex = 0;
let todosProdutos = [];
let unsubscribeProdutos = null;

// ========================= DOM REFS =========================
const telaLogin = document.getElementById("tela-login");
const conteudoRestrito = document.getElementById("conteudo-restrito");
const btnEntrar = document.getElementById("btnEntrar");
const btnSair = document.getElementById("btnSair");
const loginEmail = document.getElementById("loginEmail");
const loginSenha = document.getElementById("loginSenha");

const formCadastro = document.getElementById("formCadastro");
const editIdInput = document.getElementById("editId");
const btnSalvar = document.getElementById("btnSalvar");
const btnAtualizarProduto = document.getElementById("btnAtualizarProduto");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
const headerActionsEdicao = document.getElementById("header-actions-edicao");
const tituloFormulario = document.getElementById("titulo-formulario");
const subtituloFormulario = document.getElementById("subtitulo-formulario");

const imagemInput = document.getElementById("imagemInput");
const previewContainer = document.getElementById("previewContainer");
const uploadArea = document.getElementById("uploadArea");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");

const barraPesquisa = document.getElementById("barraPesquisa");
const btnLimparPesquisa = document.getElementById("btnLimparPesquisa");
const tabelaWrapper = document.getElementById("tabelaWrapper");
const tabelaBody = document.getElementById("tabelaBody");
const tabelaTitulo = document.getElementById("tabelaTitulo");
const tabelaEmpty = document.getElementById("tabelaEmpty");
const resultadosPesquisa = document.getElementById("resultadosPesquisa");
const bodyPesquisa = document.getElementById("bodyPesquisa");
const btnFecharTabela = document.getElementById("btnFecharTabela");

// ========================= TOAST =========================
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => { t.className = "toast"; }, 3500);
}

// ========================= AUTH =========================
onAuthStateChanged(auth, (user) => {
  if (user) {
    telaLogin.style.display = "none";
    conteudoRestrito.style.display = "flex";
    init();
  } else {
    telaLogin.style.display = "flex";
    conteudoRestrito.style.display = "none";
  }
});

btnEntrar.addEventListener("click", () => {
  const email = loginEmail.value.trim();
  const senha = loginSenha.value;
  if (!email || !senha) { showToast("Preencha email e senha", "error"); return; }
  btnEntrar.textContent = "Entrando...";
  signInWithEmailAndPassword(auth, email, senha)
    .then(() => {
      loginEmail.value = "";
      loginSenha.value = "";
      btnEntrar.textContent = "Entrar no Sistema";
    })
    .catch((error) => {
      showToast("Erro ao entrar: " + error.message, "error");
      btnEntrar.textContent = "Entrar no Sistema";
    });
});

btnSair.addEventListener("click", () => {
  signOut(auth).then(() => window.location.reload());
});

// ========================= INIT =========================
function init() {
  gerarFormularioCategorias();
  carregarProdutos();
  gerarBotoesCategorias();
}

// ========================= NAVEGAÇÃO =========================
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    const page = btn.dataset.page;
    document.getElementById(`page-${page}`).classList.add("active");
  });
});

// ========================= CATEGORIAS ACCORDION =========================
function gerarFormularioCategorias() {
  const container = document.getElementById("container-checkboxes");
  container.innerHTML = "";

  Object.keys(dadosCategorias).forEach(cat => {
    const subs = dadosCategorias[cat];
    const idCat = `cat-${cat.replace(/[^a-zA-Z0-9]/g, '')}`;

    const item = document.createElement("div");
    item.className = "cat-item";
    item.dataset.cat = cat;

    const header = document.createElement("div");
    header.className = "cat-header";
    header.innerHTML = `
      <input type="checkbox" class="cat-checkbox cat-check" id="${idCat}" value="${cat}">
      <label class="cat-label" for="${idCat}">${cat}</label>
      ${subs.length > 0 ? '<span class="cat-arrow">▶</span>' : ''}
    `;

    item.appendChild(header);

    if (subs.length > 0) {
      const subsDiv = document.createElement("div");
      subsDiv.className = "cat-subs";

      subs.forEach(sub => {
        const idSub = `sub-${sub.replace(/[^a-zA-Z0-9]/g, '')}`;
        const subItem = document.createElement("label");
        subItem.className = "sub-item";
        subItem.innerHTML = `
          <input type="checkbox" class="sub-check" id="${idSub}" value="${sub}">
          ${sub}
        `;
        subItem.querySelector("input").addEventListener("change", () => {
          subItem.classList.toggle("checked", subItem.querySelector("input").checked);
          atualizarEstadoCategoria(item);
        });
        subsDiv.appendChild(subItem);
      });

      item.appendChild(subsDiv);

      // Toggle accordion ao clicar no header (exceto no checkbox)
      header.addEventListener("click", (e) => {
        if (e.target.classList.contains("cat-checkbox") || e.target.tagName === "LABEL") return;
        item.classList.toggle("open");
      });

      // Abrir accordion ao marcar categoria
      header.querySelector(".cat-checkbox").addEventListener("change", (e) => {
        if (e.target.checked) item.classList.add("open");
        atualizarEstadoCategoria(item);
      });
    }

    container.appendChild(item);
  });
}

function atualizarEstadoCategoria(item) {
  const header = item.querySelector(".cat-header");
  const temMarcado = item.querySelectorAll(".sub-check:checked, .cat-check:checked").length > 0;
  header.classList.toggle("has-checked", temMarcado);
}

// ========================= UPLOAD DE IMAGENS =========================
uploadArea.addEventListener("click", (e) => {
  if (e.target !== imagemInput) imagemInput.click();
});

uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = "var(--green-500)";
  uploadArea.style.background = "var(--green-50)";
});
uploadArea.addEventListener("dragleave", () => {
  uploadArea.style.borderColor = "";
  uploadArea.style.background = "";
});
uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = "";
  uploadArea.style.background = "";
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
  processarArquivos(files);
});

imagemInput.addEventListener("change", (e) => {
  processarArquivos(Array.from(e.target.files));
  imagemInput.value = "";
});

function processarArquivos(files) {
  files.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ehCapa = imagensTemp.length === 0;
      imagensTemp.push({ file, url: ev.target.result, capa: ehCapa, isNew: true });
      renderizarPreviews();
    };
    reader.readAsDataURL(file);
  });
}

function renderizarPreviews() {
  previewContainer.innerHTML = "";
  imagensTemp.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = `preview-item${item.capa ? " capa" : ""}`;

    div.innerHTML = `
      <img src="${item.url}" alt="Imagem ${index + 1}">
      ${item.capa ? '<span class="preview-capa-badge">Capa</span>' : ''}
      <button class="preview-remove" data-index="${index}" title="Remover">✕</button>
      <button class="preview-expand" data-index="${index}" title="Ampliar">⤢</button>
    `;

    // Definir como capa
    div.querySelector("img").addEventListener("click", () => {
      imagensTemp.forEach(i => i.capa = false);
      imagensTemp[index].capa = true;
      renderizarPreviews();
    });

    // Remover
    div.querySelector(".preview-remove").addEventListener("click", (e) => {
      e.stopPropagation();
      imagensTemp.splice(index, 1);
      if (imagensTemp.length > 0 && !imagensTemp.some(i => i.capa)) imagensTemp[0].capa = true;
      renderizarPreviews();
    });

    // Ampliar
    div.querySelector(".preview-expand").addEventListener("click", (e) => {
      e.stopPropagation();
      abrirLightbox(index);
    });

    previewContainer.appendChild(div);
  });
}

// ========================= LIGHTBOX =========================
function abrirLightbox(index) {
  lightboxIndex = index;
  lightboxImg.src = imagensTemp[index].url;
  lightbox.style.display = "flex";
  document.body.style.overflow = "hidden";
}

document.getElementById("lightboxClose").addEventListener("click", () => {
  lightbox.style.display = "none";
  document.body.style.overflow = "";
});

document.getElementById("lightboxPrev").addEventListener("click", () => {
  lightboxIndex = (lightboxIndex - 1 + imagensTemp.length) % imagensTemp.length;
  lightboxImg.src = imagensTemp[lightboxIndex].url;
});

document.getElementById("lightboxNext").addEventListener("click", () => {
  lightboxIndex = (lightboxIndex + 1) % imagensTemp.length;
  lightboxImg.src = imagensTemp[lightboxIndex].url;
});

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) {
    lightbox.style.display = "none";
    document.body.style.overflow = "";
  }
});

document.addEventListener("keydown", (e) => {
  if (lightbox.style.display !== "flex") return;
  if (e.key === "Escape") { lightbox.style.display = "none"; document.body.style.overflow = ""; }
  if (e.key === "ArrowLeft") document.getElementById("lightboxPrev").click();
  if (e.key === "ArrowRight") document.getElementById("lightboxNext").click();
});

// ========================= SUBMIT FORM =========================
formCadastro.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!auth.currentUser) return;

  const idParaEditar = editIdInput.value;
  if (idParaEditar) {
    // Confirmação de atualização via botão separado
    return;
  }

  await salvarProduto(false);
});

btnAtualizarProduto.addEventListener("click", async () => {
  const confirma = confirm("Deseja salvar as alterações neste produto?");
  if (!confirma) return;
  await salvarProduto(true);
});

async function salvarProduto(isEdicao) {
  if (!auth.currentUser) return;

  const btnAtivo = isEdicao ? btnAtualizarProduto : btnSalvar;
  const textoOriginal = btnAtivo.innerHTML;
  btnAtivo.innerHTML = isEdicao ? "Salvando..." : "Cadastrando...";
  btnAtivo.disabled = true;

  try {
    const nome = document.getElementById("nomeProduto").value.trim();
    const preco = parseFloat(document.getElementById("preco").value);
    const descricao = document.getElementById("descricao").value.trim();
    const emPromocao = document.getElementById("emPromocao").checked;
    const produtoDestaque = document.getElementById("produtoDestaque").checked;

    if (!nome || isNaN(preco)) {
      showToast("Preencha nome e preço corretamente", "error");
      return;
    }

    let imagens = [];

    if (imagensTemp.length > 0) {
      btnAtivo.innerHTML = "Enviando fotos...";
      for (let i = 0; i < imagensTemp.length; i++) {
        const item = imagensTemp[i];
        if (!item.isNew && item.url && item.url.startsWith("http")) {
          imagens.push({ url: item.url, capa: item.capa });
          continue;
        }
        const nomeArq = `produtos/${Date.now()}_${i}_${item.file.name}`;
        const storageRef = ref(storage, nomeArq);
        await uploadBytes(storageRef, item.file);
        const url = await getDownloadURL(storageRef);
        imagens.push({ url, capa: item.capa });
      }
    }

    const categorias = [];
    document.querySelectorAll(".cat-check:checked").forEach(cb => categorias.push(cb.value));
    const subcategorias = [];
    document.querySelectorAll(".sub-check:checked").forEach(cb => subcategorias.push(cb.value));

    const produtoData = {
      nome, preco, descricao, emPromocao, produtoDestaque,
      imagens, categorias, subcategorias,
      atualizadoEm: new Date()
    };

    const idParaEditar = editIdInput.value;
    if (isEdicao && idParaEditar) {
      await updateDoc(doc(db, "produtos", idParaEditar), produtoData);
      showToast("✅ Produto atualizado com sucesso!", "success");
      cancelarModoEdicao(false);
    } else {
      produtoData.criadoEm = new Date();
      await addDoc(collection(db, "produtos"), produtoData);
      showToast("✅ Produto cadastrado com sucesso!", "success");
      limparFormulario();
    }

  } catch (error) {
    console.error(error);
    showToast("Erro: " + error.message, "error");
  } finally {
    btnAtivo.innerHTML = textoOriginal;
    btnAtivo.disabled = false;
  }
}

// ========================= CANCELAR EDIÇÃO =========================
btnCancelarEdicao.addEventListener("click", () => {
  const confirma = confirm("Deseja cancelar a edição? As alterações não salvas serão perdidas.");
  if (!confirma) return;
  cancelarModoEdicao(true);
});

function cancelarModoEdicao(mostrarFeedback = true) {
  limparFormulario();
  // Modo cadastro
  tituloFormulario.textContent = "Novo Produto";
  subtituloFormulario.textContent = "Preencha os dados para cadastrar um novo produto";
  btnSalvar.style.display = "inline-flex";
  btnAtualizarProduto.style.display = "none";
  headerActionsEdicao.style.display = "none";
  editIdInput.value = "";

  if (mostrarFeedback) {
    showToast("⚠️ Produto não foi atualizado", "warning");
  }
}

function ativarModoEdicao() {
  tituloFormulario.textContent = "Editar Produto";
  subtituloFormulario.textContent = "Altere os dados e clique em Atualizar Produto";
  btnSalvar.style.display = "none";
  btnAtualizarProduto.style.display = "inline-flex";
  headerActionsEdicao.style.display = "flex";

  // Navegar para página de cadastro
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelector('[data-page="cadastro"]').classList.add("active");
  document.getElementById("page-cadastro").classList.add("active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function limparFormulario() {
  formCadastro.reset();
  editIdInput.value = "";
  imagensTemp = [];
  previewContainer.innerHTML = "";
  limparCheckboxes();
  // Resetar toggles
  document.querySelectorAll(".cat-item").forEach(i => {
    i.classList.remove("open");
    i.querySelector(".cat-header")?.classList.remove("has-checked");
  });
}

function limparCheckboxes() {
  document.querySelectorAll(".cat-check, .sub-check").forEach(cb => {
    cb.checked = false;
    cb.closest(".sub-item")?.classList.remove("checked");
  });
}

// ========================= CARREGAR PRODUTOS =========================
function carregarProdutos() {
  if (!auth.currentUser) return;
  if (unsubscribeProdutos) unsubscribeProdutos();

  unsubscribeProdutos = onSnapshot(collection(db, "produtos"), (snapshot) => {
    todosProdutos = [];
    snapshot.forEach((docSnap) => todosProdutos.push({ ...docSnap.data(), id: docSnap.id }));
    todosProdutos.reverse();
    // Atualizar tabela se aberta
    if (tabelaWrapper.style.display !== "none") {
      const visaoAtiva = document.querySelector(".visao-btn.active, .visao-tag.active");
      if (visaoAtiva) visaoAtiva.click();
    }
    if (resultadosPesquisa.style.display !== "none") {
      executarPesquisa(barraPesquisa.value);
    }
  });
}

// ========================= BOTÕES DE CATEGORIA =========================
function gerarBotoesCategorias() {
  const container = document.getElementById("btnsCategorias");
  container.innerHTML = "";
  Object.keys(dadosCategorias).forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "visao-tag";
    btn.textContent = cat;
    btn.dataset.visao = `cat-${cat}`;
    btn.addEventListener("click", () => abrirVisao(`cat-${cat}`, cat));
    container.appendChild(btn);
  });
}

// ========================= VISÃO DE PRODUTOS =========================
document.querySelectorAll(".visao-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const visao = btn.dataset.visao;
    let titulo = "";
    if (visao === "promocao") titulo = "🏷️ Produtos em Promoção";
    else if (visao === "destaque") titulo = "⭐ Produtos Destaque";
    else if (visao === "todos") titulo = "📦 Todos os Produtos";
    abrirVisao(visao, titulo);
  });
});

function abrirVisao(visao, titulo) {
  // Marcar ativo
  document.querySelectorAll(".visao-btn, .visao-tag").forEach(b => b.classList.remove("active"));
  const btnAtivo = document.querySelector(`[data-visao="${visao}"]`);
  if (btnAtivo) btnAtivo.classList.add("active");

  tabelaTitulo.textContent = titulo;
  tabelaWrapper.style.display = "block";
  resultadosPesquisa.style.display = "none";

  let filtrados = [];
  if (visao === "promocao") filtrados = todosProdutos.filter(p => p.emPromocao === true || p.emPromocao === "true");
  else if (visao === "destaque") filtrados = todosProdutos.filter(p => p.produtoDestaque === true || p.produtoDestaque === "true");
  else if (visao === "todos") filtrados = todosProdutos;
  else if (visao.startsWith("cat-")) {
    const cat = visao.replace("cat-", "");
    filtrados = todosProdutos.filter(p =>
      (p.categorias || []).includes(cat) || (p.subcategorias || []).includes(cat)
    );
  }

  renderizarTabela(tabelaBody, filtrados);
  tabelaEmpty.style.display = filtrados.length === 0 ? "block" : "none";
  tabelaWrapper.querySelector(".table-scroll").style.display = filtrados.length === 0 ? "none" : "block";
  tabelaWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
}

btnFecharTabela.addEventListener("click", () => {
  tabelaWrapper.style.display = "none";
  document.querySelectorAll(".visao-btn, .visao-tag").forEach(b => b.classList.remove("active"));
});

// ========================= PESQUISA =========================
barraPesquisa.addEventListener("input", () => {
  const q = barraPesquisa.value.trim();
  btnLimparPesquisa.style.display = q ? "block" : "none";
  if (q.length >= 2) {
    tabelaWrapper.style.display = "none";
    document.querySelectorAll(".visao-btn, .visao-tag").forEach(b => b.classList.remove("active"));
    executarPesquisa(q);
  } else {
    resultadosPesquisa.style.display = "none";
  }
});

btnLimparPesquisa.addEventListener("click", () => {
  barraPesquisa.value = "";
  btnLimparPesquisa.style.display = "none";
  resultadosPesquisa.style.display = "none";
});

function executarPesquisa(q) {
  const termo = q.toLowerCase();
  const filtrados = todosProdutos.filter(p => {
    const campos = [
      p.nome || "",
      p.descricao || "",
      ...(p.categorias || []),
      ...(p.subcategorias || [])
    ].join(" ").toLowerCase();
    return campos.includes(termo);
  });

  renderizarTabela(bodyPesquisa, filtrados);
  resultadosPesquisa.style.display = "block";
}

// ========================= RENDERIZAR TABELA =========================
function renderizarTabela(tbody, produtos) {
  tbody.innerHTML = "";
  if (produtos.length === 0) return;

  produtos.forEach((produto) => {
    const tr = document.createElement("tr");

    const isPromo = produto.emPromocao === true || produto.emPromocao === "true";
    const isDestaque = produto.produtoDestaque === true || produto.produtoDestaque === "true";

    const preco = parseFloat(produto.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const catsDisplay = [...(produto.categorias || []), ...(produto.subcategorias || [])].join(", ");

    let thumb = `<div class="td-thumb-placeholder">📦</div>`;
    if (produto.imagens && produto.imagens.length > 0) {
      const capa = produto.imagens.find(img => img.capa) || produto.imagens[0];
      thumb = `<img src="${capa.url}" class="td-thumb" alt="Produto">`;
    }

    tr.innerHTML = `
      <td>
        <div class="td-produto">
          ${thumb}
          <span class="td-nome">${produto.nome || ""}</span>
        </div>
      </td>
      <td>${preco}</td>
      <td><small style="color:var(--gray-500)">${catsDisplay || "—"}</small></td>
      <td>${isPromo ? '<span class="badge badge-sim">Sim</span>' : '<span class="badge badge-nao">Não</span>'}</td>
      <td>${isDestaque ? '<span class="badge badge-sim">Sim</span>' : '<span class="badge badge-nao">Não</span>'}</td>
      <td class="col-acoes">
        <div class="acoes-wrapper">
          <button class="btn-action btn-edit" data-id="${produto.id}">Editar</button>
          <button class="btn-action btn-delete" data-id="${produto.id}">Excluir</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Botões
  tbody.querySelectorAll(".btn-edit").forEach(btn =>
    btn.addEventListener("click", () => prepararEdicao(btn.dataset.id))
  );
  tbody.querySelectorAll(".btn-delete").forEach(btn =>
    btn.addEventListener("click", () => deletarProduto(btn.dataset.id))
  );
}

// ========================= DELETAR PRODUTO =========================
async function deletarProduto(id) {
  const confirma = confirm("Deseja mesmo excluir o produto e todas as suas informações? Esta ação não pode ser desfeita.");
  if (!confirma) return;
  try {
    await deleteDoc(doc(db, "produtos", id));
    showToast("🗑️ Produto excluído", "success");
  } catch (error) {
    showToast("Erro ao excluir: " + error.message, "error");
  }
}

// ========================= PREPARAR EDIÇÃO =========================
async function prepararEdicao(id) {
  try {
    const docSnap = await getDoc(doc(db, "produtos", id));
    if (!docSnap.exists()) { showToast("Produto não encontrado", "error"); return; }

    const data = docSnap.data();

    // Limpar estado
    limparFormulario();
    imagensTemp = [];
    previewContainer.innerHTML = "";

    // Preencher campos
    document.getElementById("nomeProduto").value = data.nome || "";
    document.getElementById("preco").value = data.preco || "";
    document.getElementById("descricao").value = data.descricao || "";
    document.getElementById("emPromocao").checked = data.emPromocao === true || data.emPromocao === "true";
    document.getElementById("produtoDestaque").checked = data.produtoDestaque === true || data.produtoDestaque === "true";
    editIdInput.value = id;

    // Imagens existentes
    if (data.imagens && data.imagens.length > 0) {
      data.imagens.forEach((imgData) => {
        imagensTemp.push({ file: null, url: imgData.url, capa: imgData.capa || false, isNew: false });
      });
      if (!imagensTemp.some(i => i.capa)) imagensTemp[0].capa = true;
      renderizarPreviews();
    }

    // Categorias e subcategorias
    limparCheckboxes();
    // Resetar estado visual dos accordions
    document.querySelectorAll(".cat-item").forEach(i => {
      i.classList.remove("open");
      i.querySelector(".cat-header")?.classList.remove("has-checked");
    });

    (data.categorias || []).forEach(cat => {
      const idCat = `cat-${cat.replace(/[^a-zA-Z0-9]/g, '')}`;
      const cb = document.getElementById(idCat);
      if (cb) {
        cb.checked = true;
        const catItem = cb.closest(".cat-item");
        if (catItem) {
          catItem.classList.add("open");
          catItem.querySelector(".cat-header")?.classList.add("has-checked");
        }
      }
    });

    (data.subcategorias || []).forEach(sub => {
      const idSub = `sub-${sub.replace(/[^a-zA-Z0-9]/g, '')}`;
      const cb = document.getElementById(idSub);
      if (cb) {
        cb.checked = true;
        cb.closest(".sub-item")?.classList.add("checked");
        const catItem = cb.closest(".cat-item");
        if (catItem) {
          catItem.classList.add("open");
          catItem.querySelector(".cat-header")?.classList.add("has-checked");
        }
      }
    });

    ativarModoEdicao();

  } catch (error) {
    showToast("Erro ao carregar produto: " + error.message, "error");
    console.error(error);
  }
}