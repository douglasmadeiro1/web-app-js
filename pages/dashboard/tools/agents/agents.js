// ========================
// Variáveis principais
// ========================
let idAgenteEdicao = null;
let ordemReversa = false;

document.addEventListener("DOMContentLoaded", () => {
  const formAgente = document.getElementById("formAgente");
  const listaAgentes = document.getElementById("listaAgentes");
  const msgAgente = document.getElementById("msgAgente");
  const modalAgente = document.getElementById("modalAgente");
  const btnAbrirAgente = document.getElementById("abrirModalAgente");
  const spanFecharAgente = modalAgente ? modalAgente.querySelector(".fechar") : null;
  const tituloModalAgente = document.getElementById("tituloModalAgente");

  // ========================
  // Abrir/fechar modal Agente
  // ========================
  if (btnAbrirAgente) {
    btnAbrirAgente.onclick = () => {
      idAgenteEdicao = null;
      tituloModalAgente.textContent = "Novo Agente";
      formAgente.querySelector("button[type='submit']").textContent = "Salvar Agente";
      formAgente.reset();
      modalAgente.style.display = "flex";
    };
  }

  if (spanFecharAgente) {
    spanFecharAgente.onclick = () => {
      modalAgente.style.display = "none";
    };
  }

  window.onclick = (event) => {
    if (event.target === modalAgente) {
      modalAgente.style.display = "none";
    }
  };

  // ========================
  // Validação de CPF
  // ========================
  function validarCPF(cpf) {
    return /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/.test(cpf);
  }

  // ========================
  // Salvar ou atualizar agente
  // ========================
  if (formAgente) {
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
        telefone: document.getElementById("telefoneAgente").value,
        endereco: document.getElementById("enderecoAgente").value,
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
        carregarAgentes();
        idAgenteEdicao = null;
      } catch (error) {
        console.error("Erro ao salvar agente:", error);
        msgAgente.textContent = "❌ Erro ao salvar agente!";
      }
    });
  }

  // ========================
  // Funções de CRUD globais
  // ========================
  window.editarAgente = async (id) => {
    try {
      const docSnap = await db.collection("agentes").doc(id).get();
      if (!docSnap.exists) {
        alert("Agente não encontrado!");
        return;
      }
      const agente = docSnap.data();
      idAgenteEdicao = id;
      document.getElementById("nomeCompleto").value = agente.nomeCompleto || "";
      document.getElementById("nomeFuncional").value = agente.nomeFuncional || "";
      document.getElementById("cpfAgente").value = agente.cpf || "";
      document.getElementById("matriculaAgente").value = agente.matricula || "";
      document.getElementById("nascimentoAgente").value = agente.nascimento || "";
      document.getElementById("graduacaoAgente").value = agente.graduacao || "";
      document.getElementById("telefoneAgente").value = agente.telefone || "";
      document.getElementById("enderecoAgente").value = agente.endereco || "";
      document.getElementById("psicoValidade").value = agente.psicoValidade || "";
      document.getElementById("porteValidade").value = agente.porteValidade || "";
      tituloModalAgente.textContent = "Editar Agente";
      formAgente.querySelector("button[type='submit']").textContent = "Atualizar Agente";
      modalAgente.style.display = "flex";
    } catch (error) {
      console.error("Erro ao editar agente:", error);
      msgAgente.textContent = "❌ Erro ao carregar agente!";
    }
  };

  window.excluirAgente = async (id) => {
    if (confirm("Tem certeza que deseja excluir este agente?")) {
      try {
        await db.collection("agentes").doc(id).delete();
        msgAgente.textContent = "✅ Agente excluído!";
        carregarAgentes();
      } catch (error) {
        console.error("Erro ao excluir agente:", error);
        msgAgente.textContent = "❌ Erro ao excluir!";
      }
    }
  };

  // ========================
  // Carregar lista de agentes
  // ========================
  // ========================
  // Carregar lista de agentes
  // ========================
  async function carregarAgentes(ordenar = true, ordemReversa = false) {
    if (!listaAgentes) {
      console.error("Elemento 'listaAgentes' não encontrado.");
      return;
    }
    listaAgentes.innerHTML = "";
    const snapshot = await db.collection("agentes").get();
    const busca = document.getElementById("buscaAgente")?.value.toLowerCase() || "";
    const filtroGraduacao = document.getElementById("filtroGraduacao")?.value || "";
    const hoje = new Date();
    const prazoAlerta = new Date();
    prazoAlerta.setDate(hoje.getDate() + 30);
    let agentesArray = [];

    snapshot.forEach((docSnap) => {
      const agente = docSnap.data();
      const id = docSnap.id;
      if (busca && !agente.nomeCompleto.toLowerCase().includes(busca) && !agente.matricula.includes(busca)) return;
      if (filtroGraduacao && agente.graduacao !== filtroGraduacao) return;

      function getStatus(dataValidade) {
        if (!dataValidade) return "ok";
        const dt = new Date(dataValidade + "T00:00:00");
        if (dt < hoje) return "vencido";
        if (dt <= prazoAlerta) return "proximo";
        return "ok";
      }

      const statusPsico = getStatus(agente.psicoValidade);
      const statusPorte = getStatus(agente.porteValidade);
      let status = "ok";
      if (statusPsico === "vencido" || statusPorte === "vencido") status = "vencido";
      else if (statusPsico === "proximo" || statusPorte === "proximo") status = "proximo";
      agentesArray.push({ id, ...agente, status });
    });

    // 🔴🟡🟢 Sempre ordenar: vencido > proximo > ok
    const ordem = { vencido: 0, proximo: 1, ok: 2 };
    agentesArray.sort((a, b) => ordem[a.status] - ordem[b.status]);

    if (ordemReversa) {
      agentesArray.reverse();
    }

    agentesArray.forEach((agente) => {
      const tr = document.createElement("tr");
      let cor = "#dff0d8"; // verde
      if (agente.status === "vencido") cor = "#f8d7da"; // vermelho
      else if (agente.status === "proximo") cor = "#fff3cd"; // amarelo
      tr.style.backgroundColor = cor;
      tr.innerHTML = `
              <td>${agente.nomeCompleto}</td>
              <td>${agente.nomeFuncional}</td>
              <td>${agente.cpf}</td>
              <td>${agente.matricula}</td>
              <td>${agente.nascimento}</td>
              <td>${agente.graduacao}</td>
              <td>${agente.telefone || ""}</td>
              <td>${agente.endereco || ""}</td>
              <td>${agente.psicoValidade}</td>
              <td>${agente.porteValidade}</td>
              <td>
                  <button class="icon-btn" onclick="editarAgente('${agente.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                  <button class="icon-btn delete" onclick="excluirAgente('${agente.id}')"><i class="fa-solid fa-trash-can"></i></button>
              </td>
          `;
      listaAgentes.appendChild(tr);
    });

    const pendingNotifications = agentesArray
      .filter(a => a.status === "vencido" || a.status === "proximo")
      .map(a => ({
        message: `Agente ${a.nomeCompleto} — ${a.status}`,
        link: `tools/agents/agents.html?id=${a.id}`
      }));

    if (window.addModuleNotifications) {
      window.addModuleNotifications("agentes", pendingNotifications);
    }
  }


  // ========================
  // Filtros e Botões
  // ========================
  const ordenarStatusBtn = document.getElementById("ordenarStatusBtn");
  if (ordenarStatusBtn) {
    ordenarStatusBtn.addEventListener("click", () => {
      ordemReversa = !ordemReversa;
      carregarAgentes(true, ordemReversa);
    });
  }

  const buscaAgente = document.getElementById("buscaAgente");
  if (buscaAgente) {
    buscaAgente.addEventListener("input", carregarAgentes);
  }

  const filtroGraduacao = document.getElementById("filtroGraduacao");
  if (filtroGraduacao) {
    filtroGraduacao.addEventListener("change", carregarAgentes);
  }

  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => window.history.back());
  }

  // Inicialização
  carregarAgentes();
});