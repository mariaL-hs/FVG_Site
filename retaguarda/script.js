import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// configuraçao do Firebase ---------------------------
// configuração de segurança é feita diretamente no bd > regras
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

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("Cadastros");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nomeProduto").value;
    const preco = parseFloat(document.getElementById("preco").value);
    if (isNaN(preco)) {
      alert("Preço digitado com formato inválido!")
      return
    }

    const descricao = document.getElementById("descricao").value;
    const imagemURL = document.getElementById("imagemURL").value;
    const categorias = [];
    ["suprimentos", "equipamento", "etiquetas"].forEach(id => {
      const checkbox = document.getElementById(id);
      if (checkbox.checked) categorias.push(checkbox.value);
    });
    const subcategorias = [];
    ["mercado", "padaria", "restaurante", "conveniencia", "acougue", "verdureira"].forEach(id => {
      const checkbox = document.getElementById(id);
      if (checkbox.checked) subcategorias.push(checkbox.value);
    });
    try {
      await addDoc(collection(db, "produtos"), {
      nome,
      preco,
      descricao,
      categorias,
      subcategorias,
      imagemURL,
      criadoEm: new Date()
    });

    alert("Produto cadastrado com sucesso!");
    form.reset();
    } catch (error) {
      alert("Erro ao cadastrar produto.");
    }
  });
});