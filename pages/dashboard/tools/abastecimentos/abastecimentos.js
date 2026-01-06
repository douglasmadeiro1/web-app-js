// ===============================
// VARIÁVEIS GLOBAIS
// ===============================
let abastecimentoEditandoId = null;

const modal = document.getElementById("modalAbastecimento");
const abrirModalBtn = document.getElementById("abrirModalAbastecimento");
const fecharModalBtn = modal.querySelector(".fechar");

const form = document.getElementById("formAbastecimento");
const lista = document.getElementById("listaAbastecimentos");

const viaturaSelect = document.getElementById("viaturaSelect");
const agenteSelect = document.getElementById("agenteSelect");
const filtroViatura = document.getElementById("filtroViatura");

const kmAtualInput = document.getElementById("kmAtual");
const litrosInput = document.getElementById("litros");
const valorInput = document.getElementById("valor");
const dataInput = document.getElementById("dataAbastecimento");
const infoConsumo = document.getElementById("infoConsumo");

// filtros de período
const dataInicioInput = document.getElementById("dataInicio");
const dataFimInput = document.getElementById("dataFim");
const aplicarFiltroBtn = document.getElementById("aplicarFiltro");

// ===============================
// MODAL
// ===============================
abrirModalBtn.onclick = () => {
  abastecimentoEditandoId = null;
  form.reset();
  infoConsumo.innerHTML = "";
  modal.style.display = "flex";
};

fecharModalBtn.onclick = () => modal.style.display = "none";

window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

// ===============================
// CARREGAR VIATURAS
// ===============================
async function carregarViaturas() {
  viaturaSelect.innerHTML = `<option value="">Selecione a viatura</option>`;
  filtroViatura.innerHTML = `<option value="todas">Todas as viaturas</option>`;

  const snap = await db.collection("viaturas").orderBy("prefixo").get();

  snap.forEach(doc => {
    const v = doc.data();
    viaturaSelect.innerHTML += `<option value="${doc.id}">${v.prefixo}</option>`;
    filtroViatura.innerHTML += `<option value="${doc.id}">${v.prefixo}</option>`;
  });
}

filtroViatura.onchange = () => carregarAbastecimentos();
aplicarFiltroBtn.onclick = () => carregarAbastecimentos();

// ===============================
// CARREGAR AGENTES
// ===============================
async function carregarAgentes() {
  agenteSelect.innerHTML = `<option value="">Selecione o agente</option>`;
  const snap = await db.collection("agentes").orderBy("nomeFuncional").get();

  snap.forEach(doc => {
    const a = doc.data();
    agenteSelect.innerHTML += `<option value="${doc.id}">${a.nomeFuncional}</option>`;
  });
}

// ===============================
// CALCULAR KM RODADOS (MODAL)
// ===============================
async function calcularKmRodadosModal() {
  const viaturaId = viaturaSelect.value;
  const kmAtual = Number(kmAtualInput.value);

  if (!viaturaId || !kmAtual) {
    infoConsumo.innerHTML = "";
    return;
  }

  const snap = await db.collection("abastecimentos")
    .where("viaturaId", "==", viaturaId)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (!snap.empty) {
    const ultimo = snap.docs[0].data();
    const kmRodados = kmAtual - ultimo.kmAtual;

    infoConsumo.innerHTML = `
      <strong>KM desde o último abastecimento:</strong>
      ${kmRodados > 0 ? kmRodados : "⚠️ Quilometragem inválida"}
    `;
  } else {
    infoConsumo.innerHTML = `<strong>Primeiro abastecimento da viatura</strong>`;
  }
}

viaturaSelect.onchange = calcularKmRodadosModal;
kmAtualInput.oninput = calcularKmRodadosModal;

// ===============================
// SALVAR / EDITAR ABASTECIMENTO
// ===============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const dados = {
    viaturaId: viaturaSelect.value,
    agenteId: agenteSelect.value,
    kmAtual: Number(kmAtualInput.value),
    litros: Number(litrosInput.value),
    valor: Number(valorInput.value),
    data: dataInput.value,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (abastecimentoEditandoId) {
    await db.collection("abastecimentos")
      .doc(abastecimentoEditandoId)
      .update(dados);
  } else {
    await db.collection("abastecimentos").add(dados);
  }

  modal.style.display = "none";
  form.reset();
  infoConsumo.innerHTML = "";
  abastecimentoEditandoId = null;

  carregarAbastecimentos();
});

// ===============================
// LISTAR ABASTECIMENTOS + RESUMO
// ===============================
async function carregarAbastecimentos() {
  lista.innerHTML = "";

  let query = db.collection("abastecimentos");

  // FILTRO POR VIATURA
  if (filtroViatura.value !== "todas") {
    query = query.where("viaturaId", "==", filtroViatura.value);
  }

  // FILTRO POR PERÍODO
  if (dataInicioInput.value && dataFimInput.value) {
    query = query
      .where("data", ">=", dataInicioInput.value)
      .where("data", "<=", dataFimInput.value)
      .orderBy("data", "asc");  // Ordena pela data em ordem crescente
  } else {
    // SEM FILTRO DE DATA, ordena pela data de criação
    query = query.orderBy("data", "asc");  // Ordena pela data em ordem crescente
  }

  const limparFiltrosBtn = document.getElementById("limparFiltros");

  limparFiltrosBtn.onclick = () => {
    filtroViatura.value = "todas";
    dataInicioInput.value = "";
    dataFimInput.value = "";

    carregarAbastecimentos();
  };

  const snap = await query.get();

  let totalLitros = 0;
  let totalValor = 0;

  const porViatura = {};

  snap.docs.forEach(doc => {
    const a = doc.data();
    if (!porViatura[a.viaturaId]) porViatura[a.viaturaId] = [];
    porViatura[a.viaturaId].push({ id: doc.id, ...a });
  });

  for (const viaturaId in porViatura) {

    let kmAnterior = null;

    for (const a of porViatura[viaturaId]) {

      totalLitros += a.litros;
      totalValor += a.valor;

      let kmRodados = "—";
      let consumo = "—";

      if (kmAnterior !== null) {
        const diff = a.kmAtual - kmAnterior;
        if (diff > 0) {
          kmRodados = diff;
          consumo = a.litros > 0 ? (diff / a.litros).toFixed(2) : "—";
        }
      }

      kmAnterior = a.kmAtual;

      const vtr = await db.collection("viaturas").doc(a.viaturaId).get();
      const ag = await db.collection("agentes").doc(a.agenteId).get();

      const dataFormatada = new Date(a.data + "T00:00:00")
        .toLocaleDateString("pt-BR");

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${dataFormatada}</td>
        <td>${vtr.data()?.prefixo || ""}</td>
        <td>${ag.data()?.nomeFuncional || ""}</td>
        <td>${a.kmAtual}</td>
        <td>${kmRodados}</td>
        <td>${a.litros}</td>
        <td>${consumo}</td>
        <td>R$ ${a.valor.toFixed(2)}</td>
        <td>
          <button class="icon-btn btn-editar" data-id="${a.id}">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="icon-btn delete btn-excluir" data-id="${a.id}">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      `;
      lista.appendChild(tr);
    }
  }

  document.getElementById("resumoConsumo").innerHTML = `
    <strong>Total de litros:</strong> ${totalLitros.toFixed(2)} L |
    <strong>Total gasto:</strong> R$ ${totalValor.toFixed(2)}
  `;

  configurarBotoes();
}

// ===============================
// EDITAR / EXCLUIR
// ===============================
function configurarBotoes() {
  document.querySelectorAll(".btn-editar").forEach(btn => {
    btn.onclick = async () => {
      const snap = await db.collection("abastecimentos").doc(btn.dataset.id).get();
      const a = snap.data();

      abastecimentoEditandoId = btn.dataset.id;

      viaturaSelect.value = a.viaturaId;
      agenteSelect.value = a.agenteId;
      kmAtualInput.value = a.kmAtual;
      litrosInput.value = a.litros;
      valorInput.value = a.valor;
      dataInput.value = a.data;

      modal.style.display = "flex";
    };
  });

  document.querySelectorAll(".btn-excluir").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Deseja excluir este abastecimento?")) return;
      await db.collection("abastecimentos").doc(btn.dataset.id).delete();
      carregarAbastecimentos();
    };
  });
}

// ===============================
// EXPORTAR PDF
// ===============================
document.getElementById("exportarPdf").onclick = async () => {

  if (filtroViatura.value === "todas") {
    alert("Selecione uma viatura para exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  let y = 20;
  let totalLitros = 0;
  let totalValor = 0;
  let kmAnterior = null;

  const snap = await db.collection("abastecimentos")
    .where("viaturaId", "==", filtroViatura.value)
    .orderBy("createdAt", "asc")
    .get();

  pdf.setFontSize(14);
  pdf.text("Relatório de Abastecimentos", 10, 10);
  pdf.setFontSize(10);

  snap.docs.forEach(doc => {
    const a = doc.data();

    totalLitros += a.litros;
    totalValor += a.valor;

    let kmRodados = "—";
    if (kmAnterior !== null && a.kmAtual > kmAnterior) {
      kmRodados = a.kmAtual - kmAnterior;
    }
    kmAnterior = a.kmAtual;

    pdf.text(
      `${a.data} | KM ${a.kmAtual} | Rodados ${kmRodados} | ${a.litros} L | R$ ${a.valor.toFixed(2)}`,
      10,
      y
    );

    y += 6;
    if (y > 280) {
      pdf.addPage();
      y = 20;
    }
  });

  y += 10;
  pdf.text(`Total de litros: ${totalLitros.toFixed(2)} L`, 10, y);
  y += 6;
  pdf.text(`Total gasto: R$ ${totalValor.toFixed(2)}`, 10, y);

  pdf.save("relatorio_abastecimentos.pdf");
};

backBtn.addEventListener("click", () => history.back());
// ===============================
// INIT
// ===============================
carregarViaturas();
carregarAgentes();
carregarAbastecimentos();
