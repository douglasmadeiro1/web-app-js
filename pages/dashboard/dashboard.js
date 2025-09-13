// ====================== CÓDIGO CORRIGIDO E CONSOLIDADO ======================
// dashboard.js

// Lógica de Logout, Tema e Dropdowns de Notificação
function logout() {
  firebase.auth().signOut()
    .then(() => window.location.href = "../../index.html")
    .catch(err => alert("Erro ao sair"));
}

const toggleBtn = document.getElementById("toggle-theme");
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");
updateThemeIcon();
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  updateThemeIcon();
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});
function updateThemeIcon() {
  toggleBtn.innerHTML = document.body.classList.contains("dark") ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

document.querySelectorAll(".notification-container").forEach(container => {
  const button = container.querySelector("button");
  const dropdown = container.querySelector(".notifications-dropdown");
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    document.querySelectorAll('.notifications-dropdown').forEach(d => {
      if (d !== dropdown) d.classList.remove('active');
    });
    dropdown.classList.toggle('active');
  });
});

document.addEventListener("click", (e) => {
  document.querySelectorAll(".notifications-dropdown").forEach(dropdown => {
    if (!dropdown.parentElement.contains(e.target)) dropdown.classList.remove("active");
  });
});

// ====================== LÓGICA DE NOTIFICAÇÕES (INTEGRADA) ======================

let allModuleNotifications = {
  postura: [],
  veiculos: [],
  agentes: [],
  estabelecimentos: []
};

const notificationElements = {
  postura: { badge: document.getElementById('notif-postura'), dropdown: document.getElementById('dropdown-postura') },
  veiculos: { badge: document.getElementById('notif-veiculos'), dropdown: document.getElementById('dropdown-veiculos') },
  agentes: { badge: document.getElementById('notif-agentes'), dropdown: document.getElementById('dropdown-agentes') },
  estabelecimentos: { badge: document.getElementById('notif-estab'), dropdown: document.getElementById('dropdown-estab') }
};

function renderNotifications(moduleType) {
  const notifications = allModuleNotifications[moduleType];
  const { badge, dropdown } = notificationElements[moduleType];
  const list = dropdown.querySelector('.notification-list');

  badge.textContent = notifications.length;
  badge.style.display = notifications.length > 0 ? 'block' : 'none';
  list.innerHTML = notifications.length === 0 ? `<div class="notification-item no-notifications">Nenhuma notificação.</div>` : '';

  notifications.forEach((notif, index) => {
    const item = document.createElement('div');
    item.className = 'notification-item';
    item.innerHTML = `<p>${notif.message}</p>
                    <button class="mark-as-read" onclick="markAsRead('${moduleType}', `;

    // Redireciona ao clicar na notificação inteira
    item.style.cursor = "pointer";
    item.onclick = () => {
      window.location.href = notif.link;
    };

    // ⚠️ Adiciona o item ao dropdown
    list.appendChild(item);
  });
}

function markAsRead(moduleType, index) {
  allModuleNotifications[moduleType].splice(index, 1);
  renderNotifications(moduleType);
  // **OPCIONAL: Implemente a lógica de persistência no Firebase aqui, se necessário.**
}

// ====================== CARREGAMENTO DOS DADOS (INTEGRADO NO DASHBOARD) ======================

async function carregarVeiculos() {
  const snapshot = await db.collection("veiculos").get();
  const veiculos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const pendingNotifications = veiculos
    .filter(v => v.status !== "cumprida" && v.dataLimite && new Date(v.dataLimite + "T00:00:00") <= hoje)
    .map(v => ({
      message: `Veículo ${v.placa || ""} — ${v.marca || ""} ${v.modelo || ""} (vencido)`,
      link: `tools/abandoned_vehicles/vehicles.html?id=${v.id}`
    }));
  allModuleNotifications.veiculos = pendingNotifications;
  renderNotifications("veiculos");
}

async function carregarAgentes() {
  const snapshot = await db.collection("agentes").get();
  const agentes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prazoAlerta = new Date();
  prazoAlerta.setDate(hoje.getDate() + 30);

  const pendingNotifications = agentes
    .filter(a => {
      const statusPsicoVencido = a.psicoValidade && new Date(a.psicoValidade + "T00:00:00") < hoje;
      const statusPorteVencido = a.porteValidade && new Date(a.porteValidade + "T00:00:00") < hoje;
      const statusPsicoProximo = a.psicoValidade && new Date(a.psicoValidade + "T00:00:00") <= prazoAlerta && new Date(a.psicoValidade + "T00:00:00") >= hoje;
      const statusPorteProximo = a.porteValidade && new Date(a.porteValidade + "T00:00:00") <= prazoAlerta && new Date(a.porteValidade + "T00:00:00") >= hoje;
      return statusPsicoVencido || statusPorteVencido || statusPsicoProximo || statusPorteProximo;
    })
    .map(a => {
      let status = "ok";
      if ((a.psicoValidade && new Date(a.psicoValidade + "T00:00:00") < hoje) || (a.porteValidade && new Date(a.porteValidade + "T00:00:00") < hoje)) status = "vencido";
      else if ((a.psicoValidade && new Date(a.psicoValidade + "T00:00:00") <= prazoAlerta) || (a.porteValidade && new Date(a.porteValidade + "T00:00:00") <= prazoAlerta)) status = "proximo do vencimento";
      return {
        message: `Agente ${a.nomeFuncional} — ${status}`,
        link: `tools/agents/agents.html?id=${a.id}`
      };
    });

  allModuleNotifications.agentes = pendingNotifications;
  renderNotifications("agentes");
}


async function carregarEstabelecimentos() {
  const snapshot = await db.collection("estabelecimentos").get();
  const estabelecimentos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const pendingNotifications = estabelecimentos
    .filter(est => {
      const validade = est.validadeAlvara ? new Date(est.validadeAlvara + "T00:00:00") : null;
      if (!validade) return false;
      const diffDays = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
      return diffDays < 0 || diffDays <= 30;
    })
    .map(est => {
      const validade = est.validadeAlvara ? new Date(est.validadeAlvara + "T00:00:00") : null;
      const diffDays = validade ? Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24)) : -1;
      let status = "regular";
      if (diffDays < 0) status = "irregular";
      else if (diffDays <= 30) status = "proximo do vencimento";
      return {
        message: `Estabelecimento ${est.nomeEstabelecimento || ''} — ${status}`,
        link: `tools/commercial/commercial.html?id=${est.id}`
      };
    });

  allModuleNotifications.estabelecimentos = pendingNotifications;
  renderNotifications("estabelecimentos");
}

async function carregarNotificacoes() {
  const snapshot = await db.collection("notificacoes").get();
  const notificacoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const pendingNotifications = notificacoes
    .filter(n => {
      const dataNot = new Date(n.dataNotificacao + "T00:00:00");
      const dataLimite = new Date(dataNot);
      dataLimite.setDate(dataLimite.getDate() + n.prazoDias);
      return n.status !== "cumprida" && dataLimite < hoje;
    })
    .map(n => ({
      message: `Notificação ${n.natureza} — vencida`,
      link: `tools/notification/notification.html?id=${n.id}`
    }));
  allModuleNotifications.postura = pendingNotifications;
  renderNotifications("postura");
}

async function carregarDashboard() {
  console.log("Carregando Dashboard...");
  await carregarVeiculos();
  await carregarAgentes();
  await carregarEstabelecimentos();
  await carregarNotificacoes();
  console.log("Dashboard carregada!");
}

// Chamada inicial
carregarDashboard();