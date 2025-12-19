// ========================
// Variáveis principais
// ========================
const infringementForm = document.getElementById("infringementForm");
const infringementTableBody = document.getElementById("infringementList");
const infringementModal = document.getElementById("infringementModal");
const addInfringementBtn = document.getElementById("addInfringementBtn");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");

const buscaInput = document.getElementById("buscaInput");
const filtroNatureza = document.getElementById("filtroNatureza");
const backBtn = document.getElementById("backBtn");

let currentInfringementId = null;

// ========================
// Voltar
// ========================
backBtn.addEventListener("click", () => window.history.back());

// ========================
// Modal
// ========================
addInfringementBtn.addEventListener("click", () => {
    infringementForm.reset();
    modalTitle.textContent = "Adicionar Autuação";
    currentInfringementId = null;
    infringementModal.style.display = "flex";
});

closeModal.addEventListener("click", () => infringementModal.style.display = "none");
window.addEventListener("click", e => {
    if (e.target === infringementModal) infringementModal.style.display = "none";
});

// ========================
// Salvar autuação
// ========================
infringementForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cpf = document.getElementById("cpf").value;
    // Removi a validação de formato para simplificar, mas você pode adicioná-la de volta se necessário
    // if (cpf && !validarCPF(cpf)) {
    //     return;
    // }

    const autuacao = {
        numeroAutuacao: document.getElementById("numeroAutuacao").value,
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
        if (currentInfringementId) {
            await db.collection("autuacoes").doc(currentInfringementId).update(autuacao);
        } else {
            await db.collection("autuacoes").add(autuacao);
        }
        infringementModal.style.display = "none";
        carregarAutuacoes();
    } catch (error) {
        console.error("Erro ao salvar a autuação: ", error);
    }
});

// ========================
// Carregar autuações do Firestore
// ========================
async function carregarAutuacoes() {
    infringementTableBody.innerHTML = "";
    const snapshot = await db.collection("autuacoes").get();
    
    let autuacoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const busca = buscaInput.value.toLowerCase();
    const filtroNaturezaValue = filtroNatureza.value;

    if (busca) {
        autuacoes = autuacoes.filter(aut =>
            aut.autuado.toLowerCase().includes(busca) || aut.cpf.includes(busca)
        );
    }

    if (filtroNaturezaValue) {
        autuacoes = autuacoes.filter(aut => aut.natureza === filtroNaturezaValue);
    }

    infringementTableBody.innerHTML = "";
    autuacoes.forEach(aut => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${aut.numeroAutuacao}</td>
            <td>${formatarData(aut.dataAutuacao)}</td>
            <td>${aut.agente}</td>
            <td>${aut.autuado}</td>
            <td>${aut.cpf}</td>
            <td>${aut.endereco}</td>
            <td>${aut.natureza}</td>
            <td>${aut.prazoDias} dias</td>
            <td>${aut.atendente}</td>
            <td>
                <button class="icon-btn" onclick="editarAutuacao('${aut.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="icon-btn delete" onclick="excluirAutuacao('${aut.id}')"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        infringementTableBody.appendChild(tr);
    });
}

// ========================
// Funções CRUD
// ========================
window.editarAutuacao = async (id) => {
    const doc = await db.collection("autuacoes").doc(id).get();
    const aut = doc.data();
    
    document.getElementById("numeroAutuacao").value = aut.numeroAutuacao;
    document.getElementById("dataAutuacao").value = aut.dataAutuacao;
    document.getElementById("agente").value = aut.agente;
    document.getElementById("autuado").value = aut.autuado;
    document.getElementById("cpf").value = aut.cpf;
    document.getElementById("endereco").value = aut.endereco;
    document.getElementById("natureza").value = aut.natureza;
    document.getElementById("prazoDias").value = aut.prazoDias;
    document.getElementById("atendente").value = aut.atendente;
    document.getElementById("mapsLink").value = aut.mapsLink;

    modalTitle.textContent = "Editar Autuação";
    currentInfringementId = id;
    infringementModal.style.display = "flex";
};

window.excluirAutuacao = async (id) => {
    if (confirm("Tem certeza que deseja excluir esta autuação?")) {
        await db.collection("autuacoes").doc(id).delete();
        carregarAutuacoes();
    }
};

// ========================
// Inicialização
// ========================
document.addEventListener("DOMContentLoaded", carregarAutuacoes);
buscaInput.addEventListener("input", carregarAutuacoes);
filtroNatureza.addEventListener("change", carregarAutuacoes);

function formatarData(dataISO) {
  if (!dataISO) return "";
  const partes = dataISO.split("-"); // [aaaa, mm, dd]
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}