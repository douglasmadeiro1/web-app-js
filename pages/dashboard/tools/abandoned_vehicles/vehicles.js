// ========================
// Variáveis principais
// ========================
const vehicleForm = document.getElementById("vehicleForm");
const vehicleTableBody = document.querySelector("#vehicleTable tbody");
const vehicleModal = document.getElementById("vehicleModal");
const addVehicleBtn = document.getElementById("addVehicleBtn");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const backBtn = document.getElementById("backBtn");


let currentVehicleId = null;
let sortStatusAsc = true;


backBtn.addEventListener("click", () => window.history.back());

// ========================
// Modal
// ========================
addVehicleBtn.addEventListener("click", () => {
    vehicleForm.reset();
    modalTitle.textContent = "Adicionar Veículo";
    currentVehicleId = null;
    vehicleModal.style.display = "flex";
});

closeModal.addEventListener("click", () => vehicleModal.style.display = "none");
window.addEventListener("click", e => {
    if (e.target === vehicleModal) vehicleModal.style.display = "none";
});

// ========================
// Salvar veículo
// ========================
vehicleForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dataNotificacao = document.getElementById("dataNotificacao").value;
    const prazo = parseInt(document.getElementById("prazo").value);

    // Calcular data limite
    const dataInsercao = new Date(dataNotificacao);
    const dataLimite = new Date(dataInsercao);
    dataLimite.setDate(dataLimite.getDate() + prazo);

    // Calcular status automaticamente
    const hoje = new Date();
    let status = "pendente";
    if (hoje > dataLimite) status = "vencida";

    const vehicle = {
        dataNotificacao: dataNotificacao,
        marca: document.getElementById("marca").value,
        modelo: document.getElementById("modelo").value,
        ano: parseInt(document.getElementById("ano").value),
        cor: document.getElementById("cor").value,
        placa: document.getElementById("placa").value,
        local: document.getElementById("local").value,
        prazo: prazo,
        dataLimite: dataLimite.toISOString().split('T')[0],
        status: status
    };

    try {
        if (currentVehicleId) {
            await db.collection("veiculos").doc(currentVehicleId).update(vehicle);
        } else {
            await db.collection("veiculos").add(vehicle);
        }
        vehicleModal.style.display = "none";
        carregarVeiculos();
    } catch (error) {
        console.error("Erro ao salvar o veículo: ", error);
    }
});

// ========================
// Carregar veículos
// ========================
async function carregarVeiculos() {
    vehicleTableBody.innerHTML = "";
    const snapshot = await db.collection("veiculos").get();
    let veiculos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Ordenar por status
    veiculos.sort((a, b) => {
        if (sortStatusAsc) {
            return a.status.localeCompare(b.status);
        } else {
            return b.status.localeCompare(a.status);
        }
    });

    veiculos.forEach(v => {
        const tr = document.createElement("tr");

        // Cores da linha
        if (v.status === "pendente") tr.style.backgroundColor = "#fff3cd"; // amarelo
        else if (v.status === "vencida") tr.style.backgroundColor = "#f8d7da"; // vermelho
        else if (v.status === "cumprida") tr.style.backgroundColor = "#d4edda"; // verde

        tr.innerHTML = `
            <td>${v.dataNotificacao}</td>
            <td>${v.marca}</td>
            <td>${v.modelo}</td>
            <td>${v.ano}</td>
            <td>${v.cor}</td>
            <td>${v.placa}</td>
            <td>${v.local}</td>
            <td>${v.prazo} dias</td>
            <td>${v.status.charAt(0).toUpperCase() + v.status.slice(1)}</td>
            <td>
                <button class="icon-btn" onclick="marcarCumprida('${v.id}')">✅</button>
                <button class="icon-btn" onclick="editarVeiculo('${v.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="icon-btn delete" onclick="excluirVeiculo('${v.id}')"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        vehicleTableBody.appendChild(tr);
    });
}

// ========================
// CRUD
// ========================
window.marcarCumprida = async (id) => {
    const doc = await db.collection("veiculos").doc(id).get();
    const currentStatus = doc.data().status;
    const newStatus = currentStatus === "cumprida" ? "pendente" : "cumprida";
    await db.collection("veiculos").doc(id).update({ status: newStatus });
    carregarVeiculos();
};

window.editarVeiculo = async (id) => {
    const doc = await db.collection("veiculos").doc(id).get();
    const v = doc.data();

    document.getElementById("dataNotificacao").value = v.dataNotificacao;
    document.getElementById("marca").value = v.marca;
    document.getElementById("modelo").value = v.modelo;
    document.getElementById("ano").value = v.ano;
    document.getElementById("cor").value = v.cor;
    document.getElementById("placa").value = v.placa;
    document.getElementById("local").value = v.local;
    document.getElementById("prazo").value = v.prazo;

    modalTitle.textContent = "Editar Veículo";
    currentVehicleId = id;
    vehicleModal.style.display = "flex";
};

window.excluirVeiculo = async (id) => {
    if (confirm("Tem certeza que deseja excluir este veículo?")) {
        await db.collection("veiculos").doc(id).delete();
        carregarVeiculos();
    }
};

// ========================
// Ordenar por status
// ========================
const ordenarStatusBtn = document.getElementById("ordenarStatusBtn");
ordenarStatusBtn.addEventListener("click", () => {
    sortStatusAsc = !sortStatusAsc;
    carregarVeiculos();
});

// ========================
// Inicialização
// ========================
document.addEventListener("DOMContentLoaded", carregarVeiculos);
