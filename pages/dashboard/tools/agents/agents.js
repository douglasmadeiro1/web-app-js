const formAgente = document.getElementById("formAgente");
const listaAgentes = document.getElementById("listaAgentes");
const msgAgente = document.getElementById("msgAgente");

const modalAgente = document.getElementById("modalAgente");
const btnAbrirAgente = document.getElementById("abrirModalAgente");
const spanFecharAgente = modalAgente.querySelector(".fechar");
const tituloModalAgente = document.getElementById("tituloModalAgente");

let idAgenteEdicao = null;

// Abrir modal
btnAbrirAgente.onclick = () => {
  idAgenteEdicao = null;
  tituloModalAgente.textContent = "Novo Agente";
  formAgente.querySelector("button[type='submit']").textContent = "Salvar Agente";
  formAgente.reset(); // Limpa o formulário ao abrir
  modalAgente.style.display = "block";
};

spanFecharAgente.onclick = () => {
  modalAgente.style.display = "none";
};

window.onclick = (event) => {
  if (event.target === modalAgente) {
    modalAgente.style.display = "none";
  }
};

// Validar CPF
function validarCPF(cpf) {
  return /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/.test(cpf);
}

// Salvar ou atualizar agente
formAgente.addEventListener("submit", async (e) => {
  e.preventDefault();

  const cpf = document.getElementById("cpfAgente").value;
  if (cpf && !validarCPF(cpf)) {
    msgAgente.textContent = "⚠️ CPF inválido. Use o formato 000.000.000-00";
    return;
  }

  const data = {
    nomeCompleto: document.getElementById("nomeCompleto").value,
    nomeFuncional: document.getElementById("nomeFuncional").value,
    cpf: cpf,
    matricula: document.getElementById("matriculaAgente").value,
    nascimento: document.getElementById("nascimentoAgente").value,
    graduacao: document.getElementById("graduacaoAgente").value,
    psicoValidade: document.getElementById("psicoValidade").value,
    porteValidade: document.getElementById("porteValidade").value,
  };

  try {
    if (idAgenteEdicao) {
      await db.collection("agentes").doc(idAgenteEdicao).update(data);
      msgAgente.textContent = "✅ Agente atualizado com sucesso!";
    } else {
      await db.collection("agentes").add(data);
      msgAgente.textContent = "✅ Agente cadastrado com sucesso!";
    }

    modalAgente.style.display = "none";
    formAgente.reset();
    carregarAgentes(); // Recarrega os agentes após salvar
    idAgenteEdicao = null;
  } catch (error) {
    console.error("Erro ao salvar agente:", error);
    msgAgente.textContent = "❌ Erro ao salvar agente!";
  }
});

// Editar agente
window.editarAgente = async (id) => {
  try {
    const docSnap = await db.collection("agentes").doc(id).get();
    if (!docSnap.exists) return alert("Agente não encontrado!");

    const agente = docSnap.data();
    idAgenteEdicao = id;

    document.getElementById("nomeCompleto").value = agente.nomeCompleto;
    document.getElementById("nomeFuncional").value = agente.nomeFuncional;
    document.getElementById("cpfAgente").value = agente.cpf;
    document.getElementById("matriculaAgente").value = agente.matricula;
    document.getElementById("nascimentoAgente").value = agente.nascimento;
    document.getElementById("graduacaoAgente").value = agente.graduacao;
    document.getElementById("psicoValidade").value = agente.psicoValidade;
    document.getElementById("porteValidade").value = agente.porteValidade;

    tituloModalAgente.textContent = "Editar Agente";
    formAgente.querySelector("button[type='submit']").textContent = "Atualizar Agente";
    modalAgente.style.display = "block";
  } catch (error) {
    console.error("Erro ao editar agente:", error);
  }
};

// Excluir agente
window.excluirAgente = async (id) => {
  if (confirm("Tem certeza que deseja excluir este agente?")) {
    try {
      await db.collection("agentes").doc(id).delete();
      msgAgente.textContent = "✅ Agente excluído!";
      carregarAgentes(); // Recarrega os agentes após excluir
    } catch (error) {
      console.error("Erro ao excluir agente:", error);
      msgAgente.textContent = "❌ Erro ao excluir!";
    }
  }
};

// Carregar lista de agentes e gerar alertas
async function carregarAgentes() {
  listaAgentes.innerHTML = "";
  const snapshot = await db.collection("agentes").get();

  const busca = document.getElementById("buscaAgente").value.toLowerCase();
  const filtroGraduacao = document.getElementById("filtroGraduacao").value;

  const hoje = new Date();
  const alertas = [];

  snapshot.forEach((docSnap) => {
    const agente = docSnap.data();
    const id = docSnap.id;

    if (busca && !agente.nomeCompleto.toLowerCase().includes(busca) && !agente.matricula.includes(busca)) return;
    if (filtroGraduacao && agente.graduacao !== filtroGraduacao) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${agente.nomeCompleto}</td>
      <td>${agente.nomeFuncional}</td>
      <td>${agente.cpf}</td>
      <td>${agente.matricula}</td>
      <td>${agente.nascimento}</td>
      <td>${agente.graduacao}</td>
      <td>${agente.psicoValidade}</td>
      <td>${agente.porteValidade}</td>
      <td>
        <button onclick="editarAgente('${id}')">✏️ Editar</button>
        <button onclick="excluirAgente('${id}')">🗑️ Excluir</button>
      </td>
    `;
    listaAgentes.appendChild(tr);

    // Verificar alertas próximos ou vencidos
    const dataAlerta = new Date();
    dataAlerta.setDate(hoje.getDate() + 30); // 30 dias de antecedência

    if (agente.psicoValidade) {
      const psicoDate = new Date(agente.psicoValidade + 'T00:00:00'); // Garante que a comparação é no mesmo horário
      if (psicoDate <= dataAlerta) {
        alertas.push({ tipo: 'psico', mensagem: `⚠️ Agente ${agente.nomeCompleto} - Exame psicológico próximo ou vencido!` });
      }
    }
    if (agente.porteValidade) {
      const porteDate = new Date(agente.porteValidade + 'T00:00:00'); // Garante que a comparação é no mesmo horário
      if (porteDate <= dataAlerta) {
        alertas.push({ tipo: 'porte', mensagem: `⚠️ Agente ${agente.nomeCompleto} - Porte de arma próximo ou vencido!` });
      }
    }
  });

  // Atualizar badge de notificações
  updateNotifications(alertas);
}

// Filtros
document.getElementById("buscaAgente").addEventListener("input", carregarAgentes);
document.getElementById("filtroGraduacao").addEventListener("change", carregarAgentes);

// Inicializa
carregarAgentes();

// Botão voltar
function back() {
  window.location.href = "../../../../dashboard/dashboard.html";
}

// Variável global para armazenar as notificações
let globalNotifications = [];

// Função para renderizar as notificações na topbar
function renderNotifications() {
    const countElem = document.getElementById('notification-count');
    const dropdown = document.getElementById('notification-dropdown');
    const noNotif = document.getElementById('no-notifications');

    if (!countElem || !dropdown || !noNotif) return;

    dropdown.innerHTML = '';
    
    if (globalNotifications.length === 0) {
        noNotif.style.display = 'block';
        countElem.textContent = '0';
    } else {
        noNotif.style.display = 'none';
        countElem.textContent = globalNotifications.length;

        globalNotifications.forEach((notif, index) => {
            const div = document.createElement('div');
            div.className = 'notification-item';
            div.innerHTML = `
                <p>${notif.mensagem}</p>
                <button class="mark-as-read-btn" data-index="${index}">✔️ Lida</button>
            `;
            dropdown.appendChild(div);
        });

        // Adiciona o evento de click para os botões 'Lida'
        dropdown.querySelectorAll('.mark-as-read-btn').forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.dataset.index);
                globalNotifications.splice(index, 1);
                renderNotifications(); // Rerenderiza a lista
            });
        });
    }
}

// Função para atualizar as notificações (chamada pela função de carregar agentes)
function updateNotifications(newAlerts) {
    globalNotifications = newAlerts;
    renderNotifications();
}