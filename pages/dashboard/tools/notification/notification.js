// ========================
// Variáveis principais
// ========================
const notificationForm = document.getElementById("notificationForm");
const notificationTableBody = document.querySelector("#notificationTable tbody");
const notificationModal = document.getElementById("notificationModal");
const addNotificationBtn = document.getElementById("addNotificationBtn");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");

const buscaInput = document.getElementById("buscaInput");
const filtroStatus = document.getElementById("filtroStatus");
const filtroNatureza = document.getElementById("filtroNatureza");

const notificationIconContainer = document.getElementById("notification-icon-container");
const notificationDropdown = document.getElementById("notification-dropdown");
const notificationCountElement = document.getElementById("notification-count");
const markAsReadBtn = document.getElementById("markAsReadBtn");
const backBtn = document.getElementById("backBtn");

let globalNotifications = [];
let currentNotificationId = null;
let sortStatusAsc = true;

// ========================
// Voltar
// ========================
if (backBtn) backBtn.addEventListener("click", () => window.history.back());

// ========================
// Modal
// ========================
addNotificationBtn.addEventListener("click", () => {
    notificationForm.reset();
    modalTitle.textContent = "Adicionar Notificação";
    currentNotificationId = null;
    notificationModal.style.display = "flex";
});

closeModal.addEventListener("click", () => notificationModal.style.display = "none");
window.addEventListener("click", e => {
    if (e.target === notificationModal) notificationModal.style.display = "none";
});

// ========================
// Salvar notificação
// ========================
notificationForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dataNotificacao = new Date(document.getElementById("dataNotificacao").value);
    const prazoDias = parseInt(document.getElementById("prazoDias").value);
    const dataLimite = new Date(dataNotificacao);
    dataLimite.setDate(dataLimite.getDate() + prazoDias);

    let status = "pendente";
    const hoje = new Date();
    if (hoje > dataLimite) status = "vencida";

    const notificacao = {
        numeroNotificacao: document.getElementById("numeroNotificacao").value,
        dataNotificacao: document.getElementById("dataNotificacao").value,
        agente: document.getElementById("agente").value,
        notificado: document.getElementById("notificado").value,
        cpf: document.getElementById("cpf").value,
        endereco: document.getElementById("endereco").value,
        natureza: document.getElementById("natureza").value,
        atendente: document.getElementById("atendente").value,
        prazoDias: prazoDias,
        status: status
    };

    try {
        if (currentNotificationId) {
            await db.collection("notificacoes").doc(currentNotificationId).update(notificacao);
        } else {
            await db.collection("notificacoes").add(notificacao);
        }
        notificationModal.style.display = "none";
        carregarNotificacoes();
    } catch (error) {
        console.error("Erro ao salvar a notificação: ", error);
    }
});

// ========================
// Carregar notificações
// ========================
// ========================
// Carregar notificações
// ========================
async function carregarNotificacoes() {
    notificationTableBody.innerHTML = "";
    const snapshot = await db.collection("notificacoes").get();

    let notificacoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Atualiza status automaticamente
    const hoje = new Date();
    for (let notif of notificacoes) {
        const dataNot = new Date(notif.dataNotificacao);
        const dataLimite = new Date(dataNot);
        dataLimite.setDate(dataLimite.getDate() + notif.prazoDias);

        if (notif.status !== "cumprida") {
            const statusReal = (hoje > dataLimite) ? "vencida" : "pendente";
            if (notif.status !== statusReal) {
                notif.status = statusReal;
                db.collection("notificacoes").doc(notif.id).update({ status: statusReal }).catch(() => {/*silenciar*/ });
            }
        }
    }

    // 🔹 Filtros e busca
    const busca = buscaInput.value.toLowerCase();
    const filtroStatusValue = filtroStatus.value;
    const filtroNaturezaValue = filtroNatureza.value;

    if (busca) {
        notificacoes = notificacoes.filter(notif =>
            notif.notificado.toLowerCase().includes(busca) || notif.cpf.includes(busca) || notif.endereco.toLowerCase().includes(busca)
        );
    }
    if (filtroStatusValue) {
        notificacoes = notificacoes.filter(notif => notif.status === filtroStatusValue);
    }
    if (filtroNaturezaValue) {
        notificacoes = notificacoes.filter(notif => notif.natureza === filtroNaturezaValue);
    }

    // 🔹 Ordenar por status: vencida > pendente > cumprida
    const ordemStatus = { vencida: 1, pendente: 2, cumprida: 3 };
    
    notificacoes.sort((a, b) => {
        // Primeiro ordena pelo status (vencida > pendente > cumprida)
        const statusCompare = ordemStatus[a.status] - ordemStatus[b.status];
        
        // Se os status forem iguais, ordena pelo número da notificação
        if (statusCompare === 0) {
            return parseInt(b.numeroNotificacao) - parseInt(a.numeroNotificacao);
        }
        
        return statusCompare;
    });

    // 🔹 Preencher tabela
    notificationTableBody.innerHTML = "";
    notificacoes.forEach(notif => {
        const tr = document.createElement("tr");

        if (notif.status === "pendente") tr.style.backgroundColor = "#fff3cd";   // amarelo
        else if (notif.status === "vencida") tr.style.backgroundColor = "#f8d7da"; // vermelho
        else if (notif.status === "cumprida") tr.style.backgroundColor = "#d4edda"; // verde

        const statusText = notif.status.charAt(0).toUpperCase() + notif.status.slice(1);
        tr.innerHTML = `
            <td>${notif.numeroNotificacao}</td>
            <td>${formatarData(notif.dataNotificacao)}</td>
            <td>${notif.agente}</td>
            <td>${notif.notificado}</td>
            <td>${notif.cpf}</td>
            <td>${notif.endereco}</td>
            <td>${notif.natureza}</td>
            <td>${notif.prazoDias} dias</td>
            <td>${notif.atendente}</td>
            <td>${statusText}</td>
            <td>
                <button class="icon-btn" onclick="marcarCumprida('${notif.id}')">✅</button>
                <button class="icon-btn" onclick="editarNotificacao('${notif.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="icon-btn delete" onclick="excluirNotificacao('${notif.id}')"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        notificationTableBody.appendChild(tr);
    });

    // 🔹 Enviar notificações pendentes/vencidas para a dashboard
    const pendingNotifications = notificacoes
        .filter(n => n.status === "pendente" || n.status === "vencida")
        .map(n => ({
            message: `Notificação ${n.notificado} — ${n.status}`,
            link: `tools/notification/notification.html?id=${n.id}`
        }));

    if (window.addModuleNotifications) {
        window.addModuleNotifications("postura", pendingNotifications);
    }
}

// ========================
// CRUD
// ========================
window.marcarCumprida = async (id) => {
    const doc = await db.collection("notificacoes").doc(id).get();
    const currentStatus = doc.data().status;
    const newStatus = currentStatus === "cumprida" ? "pendente" : "cumprida";
    await db.collection("notificacoes").doc(id).update({ status: newStatus });
    carregarNotificacoes();
};

window.editarNotificacao = async (id) => {
    const doc = await db.collection("notificacoes").doc(id).get();
    const notif = doc.data();

    document.getElementById("numeroNotificacao").value = notif.numeroNotificacao;
    document.getElementById("dataNotificacao").value = notif.dataNotificacao;
    document.getElementById("agente").value = notif.agente;
    document.getElementById("notificado").value = notif.notificado;
    document.getElementById("cpf").value = notif.cpf;
    document.getElementById("endereco").value = notif.endereco;
    document.getElementById("natureza").value = notif.natureza;
    document.getElementById("prazoDias").value = notif.prazoDias;
    document.getElementById("atendente").value = notif.atendente;

    modalTitle.textContent = "Editar Notificação";
    currentNotificationId = id;
    notificationModal.style.display = "flex";
};

window.excluirNotificacao = async (id) => {
    if (confirm("Tem certeza que deseja excluir esta notificação?")) {
        await db.collection("notificacoes").doc(id).delete();
        carregarNotificacoes();
    }
};


// ========================
// Botão sino + clique fora
// ========================
if (notificationIconContainer) {
    notificationIconContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('active');
    });
}

if (markAsReadBtn) {
    markAsReadBtn.addEventListener("click", async () => {
        const pendentes = globalNotifications.map(n => n.id);
        for (let id of pendentes) {
            await db.collection("notificacoes").doc(id).update({ status: "cumprida" });
        }
        globalNotifications = [];
        renderNotifications();
        notificationDropdown.classList.remove('active');
    });
}

document.addEventListener('click', (e) => {
    if (!notificationDropdown.contains(e.target) && !notificationIconContainer.contains(e.target)) {
        notificationDropdown.classList.remove('active');
    }
});

// ========================
// Ordenar por status
// ========================
const ordenarStatusBtn = document.getElementById("ordenarStatusBtn");
if (ordenarStatusBtn) {
    ordenarStatusBtn.addEventListener("click", () => {
        sortStatusAsc = !sortStatusAsc;
        carregarNotificacoes();
    });
}

// ========================
// Inicialização
// ========================
document.addEventListener("DOMContentLoaded", carregarNotificacoes);
if (buscaInput) buscaInput.addEventListener("input", carregarNotificacoes);
if (filtroStatus) filtroStatus.addEventListener("change", carregarNotificacoes);
if (filtroNatureza) filtroNatureza.addEventListener("change", carregarNotificacoes);

function formatarData(dataISO) {
  if (!dataISO) return "";
  const partes = dataISO.split("-"); // [aaaa, mm, dd]
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}