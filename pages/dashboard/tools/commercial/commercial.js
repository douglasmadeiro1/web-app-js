
let estabelecimentoIdEmEdicao = null;
let armamentoIdEmEdicao = null;
let notifications = [];

// ========================================
// Funções de Gerenciamento de Seções e Conteúdo
// ========================================

/**
 * Abre a seção de Dashboard, carregando o resumo de regularidade.
 */
function abrirDashboard() {
  const titulo = document.getElementById("titulo-secao");
  const conteudo = document.getElementById("secao-conteudo");

  if (!titulo || !conteudo) {
    console.error("Elementos #titulo-secao ou #secao-conteudo não encontrados.");
    return;
  }

  titulo.innerText = "";
  conteudo.innerHTML = `<div id="resumo-regularidade" class="widgets"><p>Carregando resumo...</p></div>`;
  carregarResumoRegularidade();
}

/**
 * Abre uma seção específica (ex: 'estabelecimentos') e carrega o conteúdo.
 * @param {string} secao O nome da seção a ser aberta.
 * @param {string} [estabelecimentoIdParaModal=null] ID de um estabelecimento para abrir o modal de edição.
 */
function abrirSecao(secao, estabelecimentoIdParaModal = null) {
  const titulo = document.getElementById("titulo-secao");
  const conteudo = document.getElementById("secao-conteudo");

  if (!titulo || !conteudo) {
    console.error("Elementos #titulo-secao ou #secao-conteudo não encontrados.");
    return;
  }

  if (secao === "estabelecimentos") {
    titulo.innerText = "Cadastro de estabelecimentos comerciais";
    conteudo.innerHTML = `
      <form id="form-estabelecimento" onsubmit="salvarEstabelecimento(event)" style="margin-bottom: 30px;">
        <h3>Adicionar estabelecimento</h3>
        <input type="text" id="nome-estabelecimento" placeholder="Nome do estabelecimento ou razão social" required style="padding: 10px; width: 100%; margin: 10px 0;" />
        <input type="text" id="endereco-estabelecimento" placeholder="Endereço" required style="padding: 10px; width: 100%; margin: 10px 0;" />
        <input type="text" id="nome-responsavel" placeholder="Nome do responsável" required style="padding: 10px; width: 100%; margin: 10px 0;" />
        <input type="text" id="endereco-responsavel" placeholder="Endereço do responsável" required style="padding: 10px; width: 100%; margin: 10px 0;" />
        <input type="tel" id="telefone" placeholder="Telefone" required style="padding: 10px; width: 100%; margin: 10px 0;" />
        <label for="data-validade-alvara">Validade do alvará de funcionamento:</label>
        <input type="date" id="data-validade-alvara" required style="padding: 10px; width: 100%; margin: 10px 0;" />
        <label for="tipo-estabelecimento">Tipo de local:</label>
        <select id="tipo-estabelecimento" required>
          <option value="">Selecione o tipo</option>
          <option value="bar">Bar</option>
          <option value="restaurante">Restaurante</option>
          <option value="comercioRoupas">Comércio de roupas</option>
        </select>
        <button type="submit" class="btn-green">Salvar Estabelecimento</button>
      </form>
      <div id="lista-estabelecimentos" class="widgets"></div>
    `;
    fecharModalLista();
    carregarEstabelecimentos();

    if (estabelecimentoIdParaModal) {
      db.collection("estabelecimentos").doc(estabelecimentoIdParaModal).get().then(doc => {
        if (doc.exists) {
          abrirModalEdicaoEstabelecimento(doc.id, doc.data());
        }
      });
    }
  }
}

// ========================================
// Funções de Autenticação e Navegação
// ========================================

function logout() {
  firebase.auth().signOut()
    .then(() => window.location.href = "../../../index.html")
    .catch((error) => alert("Erro ao sair: " + error.message));
}

function voltarParaDashboard() {
  abrirDashboard();
}

// ========================================
// Funções de CRUD (Create, Read, Update, Delete)
// ========================================

function salvarEstabelecimento(event) {
  event.preventDefault();
  const form = document.getElementById("form-estabelecimento");
  const data = {
    nomeEstabelecimento: form['nome-estabelecimento'].value.trim(),
    enderecoEstabelecimento: form['endereco-estabelecimento'].value.trim(),
    nomeResponsavel: form['nome-responsavel'].value.trim(),
    enderecoResponsavel: form['endereco-responsavel'].value.trim(),
    telefone: form['telefone'].value.trim(),
    validadeAlvara: form['data-validade-alvara'].value,
    tipoEstabelecimento: form['tipo-estabelecimento'].value,
    criadoEm: new Date()
  };

  db.collection("estabelecimentos").add(data).then(() => {
    form.reset();
    carregarEstabelecimentos();
    verificarNotificacoes();
  }).catch((error) => {
    mostrarMensagem("Erro ao salvar estabelecimento: " + error.message);
  });
}

async function carregarEstabelecimentos() {
  const lista = document.getElementById("lista-estabelecimentos");
  if (!lista) return console.error("Elemento #lista-estabelecimentos não encontrado.");

  lista.innerHTML = "<p>Carregando estabelecimentos...</p>";

  try {
    const snapshot = await db.collection("estabelecimentos").orderBy("nomeEstabelecimento").get();
    if (snapshot.empty) {
      return lista.innerHTML = "<p>Nenhum estabelecimento cadastrado.</p>";
    }

    lista.innerHTML = "";
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (const doc of snapshot.docs) {
      const c = doc.data();
      const estabelecimentoId = doc.id;
      let status = await getEstabelecimentoStatus(estabelecimentoId, c);

      const div = document.createElement("div");
      div.className = `card card-${status}`;
      div.innerHTML = `
        <h3>${c.nomeEstabelecimento}</h3>
        <p>Endereço: ${c.enderecoEstabelecimento}</p>
        <p>Telefone: ${c.telefone}</p>
        <p>Validade do Alvará: ${formatarData(c.validadeAlvara)}</p>
        <div class="pendencias-icons">
          ${getIcon(c.validadeAlvara, 'Alvará')}
          ${await getArmamentoIcon(estabelecimentoId)}
        </div>
      `;
      div.onclick = () => abrirModalEdicaoEstabelecimento(doc.id, c);
      lista.appendChild(div);
    }
  } catch (err) {
    lista.innerHTML = `<p>Erro ao carregar estabelecimentos: ${err.message}</p>`;
  }
}

async function getArmamentoIcon(estabelecimentoId) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const armamentosSnapshot = await db.collection("estabelecimentos").doc(estabelecimentoId).collection("armamentos").get();
  for (const armaDoc of armamentosSnapshot.docs) {
    const armamento = armaDoc.data();
    if (armamento.dataGuia) {
      const dataGuia = new Date(armamento.dataGuia + 'T00:00:00');
      const diffDaysArma = Math.ceil((dataGuia - hoje) / (1000 * 60 * 60 * 24));
      if (diffDaysArma < 0) return `<i class="fas fa-exclamation-circle pendencia-icon" title="Guia de Tráfego Vencida"></i>`;
      if (diffDaysArma <= 30) return `<i class="fas fa-exclamation-triangle alerta-icon" title="Guia de Tráfego Próxima do Vencimento"></i>`;
    }
  }
  return `<i class="fas fa-check-circle ok-icon" title="Guia de Tráfego em Dia"></i>`;
}

function getIcon(dataStr, tipo) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const data = new Date(dataStr + 'T00:00:00');
  const diffDays = Math.ceil((data - hoje) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `<i class="fas fa-exclamation-circle pendencia-icon" title="${tipo} Vencido"></i>`;
  if (diffDays <= 30) return `<i class="fas fa-exclamation-triangle alerta-icon" title="${tipo} Próximo do Vencimento"></i>`;
  return `<i class="fas fa-check-circle ok-icon" title="${tipo} em Dia"></i>`;
}

// ... Resto do código (funções de modal, etc.)

function abrirModalEdicaoEstabelecimento(id, dados) {
  estabelecimentoIdEmEdicao = id;
  const modal = document.getElementById("modal-edicao-estabelecimento");
  modal.classList.remove("hidden");

  document.getElementById("edit-nome-estabelecimento").value = dados.nomeEstabelecimento || "";
  document.getElementById("edit-endereco-estabelecimento").value = dados.enderecoEstabelecimento || "";
  document.getElementById("edit-nome-responsavel").value = dados.nomeResponsavel || "";
  document.getElementById("edit-endereco-responsavel").value = dados.enderecoResponsavel || "";
  document.getElementById("edit-telefone").value = dados.telefone || "";
  document.getElementById("edit-data-validade-alvara").value = dados.validadeAlvara || "";
  document.getElementById("edit-tipo-estabelecimento").value = dados.tipoEstabelecimento || "";

  // carregarArmamentos(id);
}

function fecharModalEdicaoEstabelecimento() {
  document.getElementById("modal-edicao-estabelecimento").classList.add("hidden");
  estabelecimentoIdEmEdicao = null;
}

function salvarEdicaoEstabelecimento() {
  if (!estabelecimentoIdEmEdicao) return mostrarMensagem("Nenhum estabelecimento selecionado para edição.");

  const data = {
    nomeEstabelecimento: document.getElementById("edit-nome-estabelecimento").value.trim(),
    enderecoEstabelecimento: document.getElementById("edit-endereco-estabelecimento").value.trim(),
    nomeResponsavel: document.getElementById("edit-nome-responsavel").value.trim(),
    enderecoResponsavel: document.getElementById("edit-endereco-responsavel").value.trim(),
    telefone: document.getElementById("edit-telefone").value.trim(),
    validadeAlvara: document.getElementById("edit-data-validade-alvara").value,
    tipoEstabelecimento: document.getElementById("edit-tipo-estabelecimento").value,
    atualizadoEm: new Date()
  };

  if (!Object.values(data).every(val => val)) {
    return mostrarMensagem("Por favor, preencha todos os campos do estabelecimento.");
  }

  db.collection("estabelecimentos").doc(estabelecimentoIdEmEdicao).update(data).then(() => {
    mostrarMensagem("Estabelecimento atualizado com sucesso!");
    fecharModalEdicaoEstabelecimento();
    carregarEstabelecimentos();
    verificarNotificacoes();
  }).catch(error => {
    mostrarMensagem("Erro ao atualizar estabelecimento: " + error.message);
  });
}

function excluirEstabelecimento() {
  if (!estabelecimentoIdEmEdicao) return mostrarMensagem("Nenhum estabelecimento selecionado para exclusão.");

  mostrarConfirmacao("Tem certeza que deseja excluir este estabelecimento?").then(confirmado => {
    if (confirmado) {
      db.collection("estabelecimentos").doc(estabelecimentoIdEmEdicao).collection("armamentos").get()
        .then(snapshot => {
          const batch = db.batch();
          snapshot.forEach(doc => batch.delete(doc.ref));
          return batch.commit();
        })
        .then(() => db.collection("estabelecimentos").doc(estabelecimentoIdEmEdicao).delete())
        .then(() => {
          mostrarMensagem("Estabelecimento e armamentos excluídos com sucesso!");
          fecharModalEdicaoEstabelecimento();
          carregarEstabelecimentos();
          verificarNotificacoes();
        })
        .catch(error => mostrarMensagem("Erro ao excluir estabelecimento: " + error.message));
    }
  });
}

function mostrarMensagem(mensagem) {
  const modal = document.getElementById("modal-confirmacao");
  document.getElementById("modal-msg").textContent = mensagem;
  document.querySelector("#modal-confirmacao .modal-actions").style.display = "none";
  modal.classList.remove("hidden");
  let okButton = document.getElementById("modal-ok-button");
  if (!okButton) {
    okButton = document.createElement("button");
    okButton.id = "modal-ok-button";
    okButton.textContent = "OK";
    okButton.onclick = () => modal.classList.add("hidden");
    document.querySelector("#modal-confirmacao .modal-content").appendChild(okButton);
  } else {
    okButton.style.display = "block";
  }
}

function mostrarConfirmacao(mensagem) {
  return new Promise((resolve) => {
    const modal = document.getElementById("modal-confirmacao");
    document.getElementById("modal-msg").textContent = mensagem;
    document.querySelector("#modal-confirmacao .modal-actions").style.display = "flex";
    const okButton = document.getElementById("modal-ok-button");
    if (okButton) okButton.style.display = "none";
    modal.classList.remove("hidden");
    window.resolverConfirmacao = (resposta) => {
      modal.classList.add("hidden");
      resolve(resposta);
    };
  });
}

// ========================================
// Funções de Inicialização e Eventos
// ========================================

window.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const sidebarLinks = document.querySelectorAll('.sidebar a');

  menuToggle.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  });

  sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      }
    });
  });

  const body = document.body;
  const toggleTop = document.getElementById('toggleTheme');
  const toggleSide = document.getElementById('toggleThemeSidebar');

  function applyTheme(isDark) {
    body.classList.toggle("dark", isDark);
    if (toggleTop) toggleTop.checked = isDark;
    if (toggleSide) toggleSide.checked = isDark;
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  [toggleTop, toggleSide].forEach(toggle => {
    if (toggle) toggle.addEventListener("change", () => applyTheme(toggle.checked));
  });

  applyTheme(localStorage.getItem("theme") === "dark");

  abrirDashboard();
  verificarNotificacoes();
});

function formatarData(dataStr) {
  if (!dataStr) return "---";
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

async function verificarNotificacoes() {
  const notificationCountElement = document.getElementById('notification-count');
  notifications = [];
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const estabelecimentosSnapshot = await db.collection("estabelecimentos").get();
  for (const doc of estabelecimentosSnapshot.docs) {
    const estabelecimento = doc.data();
    const estabelecimentoId = doc.id;
    if (estabelecimento.validadeAlvara) {
      const dataValidade = new Date(estabelecimento.validadeAlvara + 'T00:00:00');
      const diffDays = Math.ceil((dataValidade - hoje) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) notifications.push({ type: 'Alvará Vencido', message: `O alvará de funcionamento de ${estabelecimento.nomeEstabelecimento} está VENCIDO!`, estabelecimentoId });
      else if (diffDays <= 30) notifications.push({ type: 'Alvará Vencendo', message: `O alvará de funcionamento de ${estabelecimento.nomeEstabelecimento} vence em ${diffDays} dia(s).`, estabelecimentoId });
    }
    const armamentosSnapshot = await db.collection("estabelecimentos").doc(estabelecimentoId).collection("armamentos").get();
    for (const armaDoc of armamentosSnapshot.docs) {
      const armamento = armaDoc.data();
      if (armamento.dataGuia) {
        const dataGuia = new Date(armamento.dataGuia + 'T00:00:00');
        const diffDays = Math.ceil((dataGuia - hoje) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) notifications.push({ type: 'Guia de Tráfego Vencida', message: `A guia de tráfego do armamento ${armamento.modelo} de ${estabelecimento.nomeEstabelecimento} está VENCIDA!`, estabelecimentoId });
        else if (diffDays <= 30) notifications.push({ type: 'Guia de Tráfego Vencendo', message: `A guia de tráfego do armamento ${armamento.modelo} de ${estabelecimento.nomeEstabelecimento} vence em ${diffDays} dia(s).`, estabelecimentoId });
      }
    }
  }
  renderNotifications();
}

function renderNotifications() {
  const notificationDropdown = document.getElementById('notification-dropdown');
  const notificationCountElement = document.getElementById('notification-count');

  notificationDropdown.innerHTML = '';
  const titleDiv = document.createElement('div');
  titleDiv.className = 'notification-title';
  titleDiv.innerHTML = '<h4>Notificações</h4>';
  notificationDropdown.appendChild(titleDiv);

  if (notifications.length === 0) {
    notificationDropdown.innerHTML += '<p class="no-notifications">Nenhuma notificação</p>';
    notificationCountElement.style.display = 'none';
    return;
  }

  notifications.forEach((notif, index) => {
    const div = document.createElement('div');
    div.className = 'notification-item';
    div.innerHTML = `<span>${notif.message}</span><button class="mark-as-read-btn" data-index="${index}">Lido</button>`;
    div.querySelector('.mark-as-read-btn').onclick = (event) => {
      event.stopPropagation();
      markNotificationAsRead(index);
    };
    div.onclick = () => {
      abrirSecao('estabelecimentos', notif.estabelecimentoId);
      notificationDropdown.classList.remove('active');
    };
    notificationDropdown.appendChild(div);
  });

  notificationCountElement.textContent = notifications.length;
  notificationCountElement.style.display = 'flex';
}

function markNotificationAsRead(index) {
  notifications.splice(index, 1);
  renderNotifications();
}

document.getElementById('notification-icon-container').addEventListener('click', () => {
  const notificationDropdown = document.getElementById('notification-dropdown');
  notificationDropdown.classList.toggle('active');
});

document.addEventListener('click', (event) => {
  const notificationIconContainer = document.getElementById('notification-icon-container');
  const notificationDropdown = document.getElementById('notification-dropdown');
  if (notificationIconContainer && notificationDropdown && !notificationIconContainer.contains(event.target) && !notificationDropdown.contains(event.target)) {
    notificationDropdown.classList.remove('active');
  }
});

/**
 * Função auxiliar para determinar o status de um estabelecimento (regular, irregular, proximoVenc)
 * considerando o alvará e as guias de tráfego.
 * @param {string} estabelecimentoId O ID do estabelecimento.
 * @param {object} est Os dados do estabelecimento.
 * @returns {Promise<string>} O status do estabelecimento.
 */
async function getEstabelecimentoStatus(estabelecimentoId, est) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  let status = "regular";

  // Verifica o alvará
  if (est.validadeAlvara) {
    const diffDays = Math.ceil((new Date(est.validadeAlvara + 'T00:00:00') - hoje) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) status = "irregular";
    else if (diffDays <= 30) status = "proximoVenc";
  }

  // Verifica as guias de tráfego
  const armamentosSnapshot = await db.collection("estabelecimentos")
    .doc(estabelecimentoId)
    .collection("armamentos")
    .get();

  for (const armaDoc of armamentosSnapshot.docs) {
    const arma = armaDoc.data();
    if (arma.dataGuia) {
      const diffDaysArma = Math.ceil((new Date(arma.dataGuia + 'T00:00:00') - hoje) / (1000 * 60 * 60 * 24));
      if (diffDaysArma < 0) {
        status = "irregular";
        break; // Status mais crítico encontrado, pode sair do loop
      } else if (diffDaysArma <= 30 && status !== "irregular") {
        status = "proximoVenc";
      }
    }
  }
  return status;
}

/**
 * Carrega o resumo de regularidade e renderiza os cartões.
 */
async function carregarResumoRegularidade() {
  const container = document.getElementById("resumo-regularidade");
  if (!container) return console.error("Elemento #resumo-regularidade não encontrado.");
  container.innerHTML = "<p>Carregando resumo...</p>";

  const resumo = {
    regular: [],
    proximoVenc: [],
    irregular: []
  };

  try {
    const estabelecimentosSnapshot = await db.collection("estabelecimentos").get();
    for (const doc of estabelecimentosSnapshot.docs) {
      const est = { id: doc.id, ...doc.data() };
      const status = await getEstabelecimentoStatus(est.id, est);
      resumo[status === "proximoVenc" ? "proximoVenc" : status].push(est);
    }

    // Armazena o resumo completo em uma variável global para acesso rápido
    window.listaResumo = resumo;

    // Renderiza os cartões de resumo
    container.innerHTML = `
      <div id="resumo-container">
        <div class="resumo-card regular" onclick="abrirListaPorSituacao('regular')">
          <h3>Regulares (${resumo.regular.length})</h3>
        </div>
        <div class="resumo-card prox-vencer" onclick="abrirListaPorSituacao('proximoVenc')">
          <h3>Próx. do Vencimento (${resumo.proximoVenc.length})</h3>
        </div>
        <div class="resumo-card irregular" onclick="abrirListaPorSituacao('irregular')">
          <h3>Irregulares (${resumo.irregular.length})</h3>
        </div>
      </div>
    `;


  } catch (err) {
    container.innerHTML = `<p>Erro ao carregar resumo: ${err.message}</p>`;
    console.error("Erro ao carregar resumo:", err);
  }
}

/**
 * Abre o modal e preenche a lista com estabelecimentos de uma determinada situação.
 * @param {string} situacao A situação dos estabelecimentos ('regular', 'proximoVenc', 'irregular').
 */
function abrirListaPorSituacao(situacao) {
  const modal = document.getElementById("modal-lista-estabelecimentos");
  const lista = document.getElementById("lista-estabelecimentos-modal");
  const titulo = document.getElementById("titulo-lista-estabelecimentos");

  if (!modal || !lista || !titulo) {
    return console.error("Um dos elementos do modal de lista não foi encontrado.");
  }

  const titulos = {
    regular: "Estabelecimentos Regulares",
    irregular: "Estabelecimentos Irregulares",
    proximoVenc: "Estabelecimentos Próximos do Vencimento"
  };

  titulo.textContent = titulos[situacao] || "Lista";
  lista.innerHTML = "";

  const dados = window.listaResumo[situacao];

  if (!dados || dados.length === 0) {
    lista.innerHTML = "<p style='text-align:center; font-weight:bold;'>Nenhum estabelecimento encontrado</p>";
  } else {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    dados.forEach(est => {
      let statusTexto = "";
      let statusClasse = "badge-regular";

      if (est.validadeAlvara) {
        const dataValidade = new Date(est.validadeAlvara + "T00:00:00");
        const diffDays = Math.ceil((dataValidade - hoje) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          statusTexto = `Vencido há ${Math.abs(diffDays)} dia${Math.abs(diffDays) > 1 ? "s" : ""}`;
          statusClasse = "badge-irregular";
        } else if (diffDays <= 30) {
          statusTexto = `Faltam ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
          statusClasse = "badge-proximo";
        } else {
          statusTexto = `Válido (${diffDays} dias restantes)`;
          statusClasse = "badge-regular";
        }
      }

      // Criar card estilizado
      const card = document.createElement("div");
      card.className = "estab-card";
      card.innerHTML = `
        <h4>${est.nomeEstabelecimento}</h4>
        <p><strong>Alvará:</strong> ${est.validadeAlvara || "Sem data"}</p>
        <span class="status ${statusClasse}">${statusTexto}</span>
      `;
      card.onclick = () => {
        abrirModalEdicaoEstabelecimento(est.id, est);
      };

      lista.appendChild(card);
    });
  }

  modal.classList.remove("hidden");
}

function fecharModalLista() {
  document.getElementById("modal-lista-estabelecimentos").classList.add("hidden");
}

