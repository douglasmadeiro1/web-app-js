const form = document.getElementById("formAutuacao");
const msg = document.getElementById("msg");
const lista = document.getElementById("listaAutuacoes");

function validarCPF(cpf) {
  return /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(cpf);
}

let idEmEdicao = null; // variável global para controlar edição
const modal = document.getElementById("modalForm");
const btnAbrir = document.getElementById("abrirModal");
const spanFechar = document.querySelector(".fechar");
const tituloModal = document.getElementById("tituloModal");

// 🟢 Salvar autuação
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const cpf = document.getElementById("cpf").value;
  if (cpf && !validarCPF(cpf)) {
    msg.textContent = "⚠️ CPF inválido. Use o formato 000.000.000-00";
    return;
  }

  const data = {
    dataAutuacao: document.getElementById("dataAutuacao").value,
    agente: document.getElementById("agente").value,
    autuado: document.getElementById("autuado").value,
    cpf: document.getElementById("cpf").value,
    endereco: document.getElementById("endereco").value,
    natureza: document.getElementById("natureza").value,
    prazoDias: parseInt(document.getElementById("prazoDias").value),
    atendente: document.getElementById("atendente").value,
    mapsLink: document.getElementById("mapsLink").value,
  };

  try {
    if (idEmEdicao) {
      await db.collection("autuacoes").doc(idEmEdicao).update(data);
      msg.textContent = "✅ Autuação atualizada com sucesso!";
      idEmEdicao = null;
      form.querySelector("button[type='submit']").textContent = "Salvar Autuação";
    } else {
      msg.textContent = "✅ Autuação salva com sucesso!";
    }

    modal.style.display = "none";
    form.reset();
    carregarAutuacoes();

  } catch (error) {
    console.error("Erro ao salvar/atualizar autuação:", error);
    msg.textContent = "❌ Erro ao salvar/atualizar autuação!";
  }
});

// Abrir modal
btnAbrir.onclick = () => {
  idEmEdicao = null;
  tituloModal.textContent = "Nova Autuação";
  form.querySelector("button[type='submit']").textContent = "Salvar Autuação";
  modal.style.display = "block";
  document.body.classList.add("modal-aberto");
};

// Fechar modal
spanFechar.onclick = () => {
  modal.style.display = "none";
  document.body.classList.remove("modal-aberto");
};
window.onclick = (event) => {
  if (event.target == modal) {
    modal.style.display = "none";
    document.body.classList.remove("modal-aberto");
  }
};

// ✏️ Editar
window.editarAutuacao = async (id) => {
  try {
    const docSnap = await db.collection("autuacoes").doc(id).get();
    if (!docSnap.exists) return alert("Autuação não encontrada!");

    const aut = docSnap.data();
    idEmEdicao = id;

    document.getElementById("dataAutuacao").value = aut.dataAutuacao;
    document.getElementById("agente").value = aut.agente;
    document.getElementById("autuado").value = aut.autuado;
    document.getElementById("cpf").value = aut.cpf;
    document.getElementById("endereco").value = aut.endereco;
    document.getElementById("natureza").value = aut.natureza;
    document.getElementById("prazoDias").value = aut.prazoDias;
    document.getElementById("atendente").value = aut.atendente;
    document.getElementById("mapsLink").value = aut.mapsLink;

    form.querySelector("button[type='submit']").textContent = "Atualizar Autuação";
    tituloModal.textContent = "Editar Autuação";
    modal.style.display = "block";

  } catch (error) {
    console.error("Erro ao carregar Autuação:", error);
  }
};

// 🗑️ Excluir
window.excluirAutuacao = async (id) => {
  if (confirm("Tem certeza que deseja excluir esta Autuação?")) {
    try {
      await db.collection("autuacoes").doc(id).delete();
      carregarAutuacoes();
      msg.textContent = "✅ Autuação excluída com sucesso!";
    } catch (error) {
      console.error("Erro ao excluir:", error);
      msg.textContent = "❌ Erro ao excluir Autuação!";
    }
  }
};

// 📋 Carregar
async function carregarAutuacoes() {
  lista.innerHTML = "";
  const snapshot = await db.collection("autuacoes").get();
  const hoje = new Date();

  const busca = document.getElementById("buscaInput").value.toLowerCase();
  const filtroNatureza = document.getElementById("filtroNatureza").value;

  for (const docSnap of snapshot.docs) {
    const aut = docSnap.data();
    const id = docSnap.id;

    const dataAut = new Date(aut.dataAutuacao);
    const prazoLimite = new Date(dataAut);
    prazoLimite.setDate(prazoLimite.getDate() + aut.prazoDias);

    if (busca && !aut.autuado.toLowerCase().includes(busca) && !aut.cpf.includes(busca)) {
      continue;
    }
    if (filtroNatureza && aut.natureza !== filtroNatureza) continue;

    const tr = document.createElement("tr");
tr.innerHTML = `
  <td>${aut.dataAutuacao}</td>
  <td>${aut.agente}</td>
  <td>${aut.autuado}</td>
  <td>${aut.cpf}</td>
  <td>${aut.endereco}</td>
  <td>${aut.natureza}</td>
  <td>${aut.prazoDias} dias</td>
  <td>${aut.atendente}</td>
  <td>
    <button onclick="editarAutuacao('${id}')">✏️</button>
    <button onclick="excluirAutuacao('${id}')">🗑️</button>
  </td>
`;
lista.appendChild(tr);
  }
}

// Filtros
document.getElementById("buscaInput").addEventListener("input", carregarAutuacoes);
document.getElementById("filtroNatureza").addEventListener("change", carregarAutuacoes);

// ✅ Marcar cumprida

carregarAutuacoes();

function back() {
    window.location.href = "../dashboard/dashboard.html";
}