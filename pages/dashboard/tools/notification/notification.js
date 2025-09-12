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
backBtn.addEventListener("click", () => window.history.back());

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
        dataNotificacao: document.getElementById("dataNotificacao").value,
        agente: document.getElementById("agente").value,
        notificado: document.getElementById("notificado").value,
        cpf: document.getElementById("cpf").value,
        endereco: document.getElementById("endereco").value,
        natureza: document.getElementById("natureza").value,
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
async function carregarNotificacoes() {
    notificationTableBody.innerHTML = "";
    const snapshot = await db.collection("notificacoes").get();

    let notificacoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Atualiza status automaticamente
    const hoje = new Date();
    notificacoes.forEach(notif => {
        const dataNot = new Date(notif.dataNotificacao);
        const dataLimite = new Date(dataNot);
        dataLimite.setDate(dataLimite.getDate() + notif.prazoDias);
        if (notif.status !== "cumprida") {
            notif.status = (hoje > dataLimite) ? "vencida" : "pendente";
            db.collection("notificacoes").doc(notif.id).update({ status: notif.status });
        }
    });

    // Filtros e busca
    const busca = buscaInput.value.toLowerCase();
    const filtroStatusValue = filtroStatus.value;
    const filtroNaturezaValue = filtroNatureza.value;

    if (busca) {
        notificacoes = notificacoes.filter(notif =>
            notif.notificado.toLowerCase().includes(busca) || notif.cpf.includes(busca)
        );
    }

    if (filtroStatusValue) {
        notificacoes = notificacoes.filter(notif => notif.status === filtroStatusValue);
    }

    if (filtroNaturezaValue) {
        notificacoes = notificacoes.filter(notif => notif.natureza === filtroNaturezaValue);
    }

    // ========================
    // Ordenar por status igual vehicles.js
    // ========================
    notificacoes.sort((a, b) => {
        if (sortStatusAsc) {
            return a.status.localeCompare(b.status);
        } else {
            return b.status.localeCompare(a.status);
        }
    });

    // Preencher tabela
    notificationTableBody.innerHTML = "";
    notificacoes.forEach(notif => {
        const tr = document.createElement("tr");

        if (notif.status === "pendente") tr.style.backgroundColor = "#fff3cd";
        else if (notif.status === "vencida") tr.style.backgroundColor = "#f8d7da";
        else if (notif.status === "cumprida") tr.style.backgroundColor = "#d4edda";

        const statusText = notif.status.charAt(0).toUpperCase() + notif.status.slice(1);
        tr.innerHTML = `
            <td>${notif.dataNotificacao}</td>
            <td>${notif.agente}</td>
            <td>${notif.notificado}</td>
            <td>${notif.cpf}</td>
            <td>${notif.endereco}</td>
            <td>${notif.natureza}</td>
            <td>${notif.prazoDias} dias</td>
            <td>${statusText}</td>
            <td>
                <button class="icon-btn" onclick="marcarCumprida('${notif.id}')">✅</button>
                <button class="icon-btn" onclick="editarNotificacao('${notif.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="icon-btn" onclick="excluirNotificacao('${notif.id}')"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        notificationTableBody.appendChild(tr);
    });

    atualizarNotificacoes(notificacoes);
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

    document.getElementById("dataNotificacao").value = notif.dataNotificacao;
    document.getElementById("agente").value = notif.agente;
    document.getElementById("notificado").value = notif.notificado;
    document.getElementById("cpf").value = notif.cpf;
    document.getElementById("endereco").value = notif.endereco;
    document.getElementById("natureza").value = notif.natureza;
    document.getElementById("prazoDias").value = notif.prazoDias;

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
// Notificações dropdown
// ========================
function renderNotifications() {
    notificationDropdown.innerHTML = '';
    if (globalNotifications.length === 0) {
        notificationDropdown.innerHTML = `<p class="no-notifications" id="no-notifications">Nenhuma notificação</p>`;
        notificationCountElement.textContent = '0';
        notificationCountElement.style.display = 'none';
    } else {
        globalNotifications.forEach(notif => {
            const div = document.createElement('div');
            div.className = 'notification-item';
            div.innerHTML = `
                <p><strong>${notif.natureza}</strong></p>
                <p>${notif.notificado} - Prazo: ${notif.prazoDias} dias</p>
            `;
            notificationDropdown.appendChild(div);
        });

        notificationCountElement.textContent = globalNotifications.length;
        notificationCountElement.style.display = 'flex';
    }
}

function atualizarNotificacoes(notificacoes) {
    globalNotifications = notificacoes.filter(n => n.status === "pendente");
    renderNotifications();
}

// ========================
// Botão sino + clique fora
// ========================
notificationIconContainer.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationDropdown.classList.toggle('active');
});

markAsReadBtn.addEventListener("click", async () => {
    const pendentes = globalNotifications.map(n => n.id);
    for (let id of pendentes) {
        await db.collection("notificacoes").doc(id).update({ status: "cumprida" });
    }
    globalNotifications = [];
    renderNotifications();
    notificationDropdown.classList.remove('active');
});

document.addEventListener('click', (e) => {
    if (!notificationDropdown.contains(e.target) && !notificationIconContainer.contains(e.target)) {
        notificationDropdown.classList.remove('active');
    }
});

// ========================
// Ordenar por status
// ========================
const ordenarStatusBtn = document.getElementById("ordenarStatusBtn");
ordenarStatusBtn.addEventListener("click", () => {
    sortStatusAsc = !sortStatusAsc;
    carregarNotificacoes();
});

// ========================
// Inicialização
// ========================
document.addEventListener("DOMContentLoaded", carregarNotificacoes);
buscaInput.addEventListener("input", carregarNotificacoes);
filtroStatus.addEventListener("change", carregarNotificacoes);
filtroNatureza.addEventListener("change", carregarNotificacoes);
