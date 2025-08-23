const form = document.getElementById("formNotificacao");
const msg = document.getElementById("msg");
const lista = document.getElementById("listaNotificacoes");

function validarCPF(cpf) {
  return /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/.test(cpf);
}
// Salvar notificação
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const cpf = document.getElementById("cpf").value;
if (cpf && !validarCPF(cpf)) {
  msg.textContent = "⚠️ CPF inválido. Use o formato 000.000.000-00";
  return;
}
  const data = {
    dataNotificacao: document.getElementById("dataNotificacao").value,
    agente: document.getElementById("agente").value,
    notificado: document.getElementById("notificado").value,
    cpf: document.getElementById("cpf").value,
    endereco: document.getElementById("endereco").value,
    natureza: document.getElementById("natureza").value,
    prazoDias: parseInt(document.getElementById("prazoDias").value),
    atendente: document.getElementById("atendente").value,
    mapsLink: document.getElementById("mapsLink").value,
  };

  try {
    if (idEmEdicao) {
      // Atualiza notificação existente
      await db.collection("notificacoes").doc(idEmEdicao).update(data);
      msg.textContent = "✅ Notificação salva com sucesso!";
      modal.style.display = "none";
      idEmEdicao = null;
      form.querySelector("button[type='submit']").textContent = "Salvar Notificação";
    } else {
      // Cria nova notificação
      await db.collection("notificacoes").add({
        ...data,
        status: "pendente"
      });
      msg.textContent = "✅ Notificação salva com sucesso!";
      modal.style.display = "none";
    }

    form.reset();
    carregarNotificacoes();

  } catch (error) {
    console.error("Erro ao salvar/atualizar notificação:", error);
    msg.textContent = "❌ Erro ao salvar/atualizar notificação!";
  }
});

const modal = document.getElementById("modalForm");
const btnAbrir = document.getElementById("abrirModal");
const spanFechar = document.querySelector(".fechar");
const tituloModal = document.getElementById("tituloModal");

// Abrir modal
btnAbrir.onclick = () => {
  idEmEdicao = null; // garante que não vem nada da edição
  tituloModal.textContent = "Nova Notificação";
  form.querySelector("button[type='submit']").textContent = "Salvar Notificação";
  modal.style.display = "block";
  document.body.classList.add("modal-aberto");
};

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


let idEmEdicao = null; // variável global para controlar edição

window.editarNotificacao = async (id) => {
  try {
    const docSnap = await db.collection("notificacoes").doc(id).get();
    if (!docSnap.exists) return alert("Notificação não encontrada!");

    const notif = docSnap.data();
    idEmEdicao = id;

    document.getElementById("dataNotificacao").value = notif.dataNotificacao;
    document.getElementById("agente").value = notif.agente;
    document.getElementById("notificado").value = notif.notificado;
    document.getElementById("cpf").value = notif.cpf;
    document.getElementById("endereco").value = notif.endereco;
    document.getElementById("natureza").value = notif.natureza;
    document.getElementById("prazoDias").value = notif.prazoDias;
    document.getElementById("atendente").value = notif.atendente;
    document.getElementById("mapsLink").value = notif.mapsLink;

    form.querySelector("button[type='submit']").textContent = "Atualizar Notificação";
    tituloModal.textContent = "Editar Notificação";

    modal.style.display = "block"; // abre modal
  } catch (error) {
    console.error("Erro ao carregar notificação:", error);
  }
};

window.excluirNotificacao = async (id) => {
  if (confirm("Tem certeza que deseja excluir esta notificação?")) {
    try {
      await db.collection("notificacoes").doc(id).delete();
      carregarNotificacoes();
      msg.textContent = "✅ Notificação excluída com sucesso!";
    } catch (error) {
      console.error("Erro ao excluir:", error);
      msg.textContent = "❌ Erro ao excluir notificação!";
    }
  }
};

// Carregar notificações
async function carregarNotificacoes() {
  lista.innerHTML = "";
  const snapshot = await db.collection("notificacoes").get();
  const hoje = new Date();

  // 🔢 contadores
  let pendentes = 0, vencidas = 0, cumpridas = 0;

  // pega filtros
  const busca = document.getElementById("buscaInput").value.toLowerCase();
  const filtroStatus = document.getElementById("filtroStatus").value;
  const filtroNatureza = document.getElementById("filtroNatureza").value;

  snapshot.forEach((docSnap) => {
    const notif = docSnap.data();
    const id = docSnap.id;

    const dataNotif = new Date(notif.dataNotificacao);
    const prazoLimite = new Date(dataNotif);
    prazoLimite.setDate(prazoLimite.getDate() + notif.prazoDias);

    let status = notif.status;
    if (notif.status === "pendente" && hoje > prazoLimite) {
  status = "vencida";
  db.collection("notificacoes").doc(id).update({ status: "vencida" });
}

    // 🔎 aplica busca (nome ou CPF)
    if (busca && !notif.notificado.toLowerCase().includes(busca) && !notif.cpf.includes(busca)) {
      return; // não exibe se não bater
    }

    // 🎛️ aplica filtros
    if (filtroStatus && status !== filtroStatus) return;
    if (filtroNatureza && notif.natureza !== filtroNatureza) return;

    // Atualiza contadores
    if (status === "pendente") pendentes++;
    if (status === "vencida") vencidas++;
    if (status === "cumprida") cumpridas++;

    // Renderiza a linha
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${notif.dataNotificacao}</td>
      <td>${notif.agente}</td>
      <td>${notif.notificado}</td>
      <td>${notif.cpf}</td>
      <td>${notif.endereco}</td>
      <td>${notif.natureza}</td>
      <td>${notif.prazoDias} dias</td>
      <td>${notif.atendente}</td>
      <td>
        ${status === "cumprida" ? "🟢 Cumprida" : ""}
        ${status === "pendente" ? "🟡 Pendente" : ""}
        ${status === "vencida" ? "🔴 Vencida" : ""}
      </td>
      <td>
        ${status !== "cumprida" ? `<button onclick="marcarCumprida('${id}')">✅ Cumprida</button>` : ""}
        <button onclick="editarNotificacao('${id}')">✏️ Editar</button>
        <button onclick="excluirNotificacao('${id}')">🗑️ Excluir</button>
      </td>
    `;
    lista.appendChild(tr);
  });

  // Atualiza contadores
  document.getElementById("contadorPendentes").textContent = pendentes;
  document.getElementById("contadorVencidas").textContent = vencidas;
  document.getElementById("contadorCumpridas").textContent = cumpridas;
}

// dispara recarga ao usar filtros ou busca
document.getElementById("buscaInput").addEventListener("input", carregarNotificacoes);
document.getElementById("filtroStatus").addEventListener("change", carregarNotificacoes);
document.getElementById("filtroNatureza").addEventListener("change", carregarNotificacoes);

// Marcar como cumprida
window.marcarCumprida = async (id) => {
  await db.collection("notificacoes").doc(id).update({ status: "cumprida" });
  carregarNotificacoes();
};

carregarNotificacoes();
