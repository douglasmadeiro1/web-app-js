// Logout
function logout() {
  firebase.auth().signOut()
    .then(() => window.location.href = "../../index.html")
    .catch(err => alert("Erro ao sair"));
}

// Tema
const toggleBtn = document.getElementById("toggle-theme");
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");
updateThemeIcon() ?
  '<i class="fas fa-sun"></i>' :
  '<i class="fas fa-moon"></i>';
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  updateThemeIcon() ?
    '<i class="fas fa-sun"></i>' :
    '<i class="fas fa-moon"></i>';
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});
function updateThemeIcon() {
  toggleBtn.innerHTML = document.body.classList.contains("dark") ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// ====================== LÓGICA DE NOTIFICAÇÕES ======================

// Objeto global para armazenar as notificações por tipo de módulo
let allModuleNotifications = {
  postura: [],
  veiculos: [],
  agentes: [],
  estabelecimentos: []
};

// Mapeia os IDs dos elementos HTML para os tipos de notificação
const notificationElements = {
  postura: {
    badge: document.getElementById('notif-postura'),
    dropdown: document.getElementById('dropdown-postura')
  },
  veiculos: {
    badge: document.getElementById('notif-veiculos'),
    dropdown: document.getElementById('dropdown-veiculos')
  },
  agentes: {
    badge: document.getElementById('notif-agentes'),
    dropdown: document.getElementById('dropdown-agentes')
  },
  estabelecimentos: {
    badge: document.getElementById('notif-estab'),
    dropdown: document.getElementById('dropdown-estab')
  }
};

/**
 * Renderiza as notificações para um tipo específico de módulo.
 * @param {string} moduleType - O tipo de módulo ('postura', 'veiculos', etc.).
 */
function renderNotifications(moduleType) {
  const notifications = allModuleNotifications[moduleType];
  const dropdown = notificationElements[moduleType].dropdown;
  const badge = notificationElements[moduleType].badge;
  const list = dropdown.querySelector('.notification-list');

  // Atualiza o contador (badge)
  badge.textContent = notifications.length;
  badge.style.display = notifications.length > 0 ? 'block' : 'none';

  // Limpa a lista
  list.innerHTML = '';

  if (notifications.length === 0) {
    list.innerHTML = `<div class="notification-item no-notifications">Nenhuma notificação.</div>`;
  } else {
    notifications.forEach((notif, index) => {
      const item = document.createElement('div');
      item.className = 'notification-item';
      item.innerHTML = `<p>${notif.message}</p>`;

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'notification-actions';

      const linkBtn = document.createElement('button');
      linkBtn.className = 'go-to-module';
      linkBtn.textContent = '▶️ Ir para o módulo';
      linkBtn.onclick = () => {
        if (notif.link) {
          window.location.href = notif.link;
        }
      };

      const readBtn = document.createElement('button');
      readBtn.className = 'mark-as-read';
      readBtn.textContent = '✔️ Lida';
      readBtn.onclick = () => {
        allModuleNotifications[moduleType].splice(index, 1);
        renderNotifications(moduleType); // Rerenderiza a lista
      };

      buttonContainer.appendChild(linkBtn);
      buttonContainer.appendChild(readBtn);
      item.appendChild(buttonContainer);
      list.appendChild(item);
    });
  }
}

/**
 * Função global que os módulos chamarão para adicionar notificações.
 * @param {string} moduleType - O tipo de módulo ('postura', 'veiculos', etc.).
 * @param {Array<Object>} newNotifications - Uma lista de objetos de notificação.
 */
window.addModuleNotifications = (moduleType, newNotifications) => {
  // Substitui as notificações existentes para evitar duplicidade
  allModuleNotifications[moduleType] = newNotifications;
  renderNotifications(moduleType);
};

// Adiciona o event listener para cada botão de notificação
document.querySelectorAll('.notification-container').forEach(container => {
  const button = container.querySelector('.icon-btn');
  const dropdown = container.querySelector('.notifications-dropdown');

  button.addEventListener('click', (event) => {
    // Fecha outros dropdowns
    document.querySelectorAll('.notifications-dropdown').forEach(d => {
      if (d !== dropdown) {
        d.classList.remove('active');
      }
    });
    // Alterna o dropdown atual
    dropdown.classList.toggle('active');
    event.stopPropagation();
  });
});

// Fecha os dropdowns ao clicar fora
document.addEventListener('click', (event) => {
  if (!event.target.closest('.notification-container')) {
    document.querySelectorAll('.notifications-dropdown').forEach(d => {
      d.classList.remove('active');
    });
  }
});

