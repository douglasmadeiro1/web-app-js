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
    const snapshot = await db.collection("veiculos").get();
    let veiculos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const hoje = new Date();
    for (let v of veiculos) {
        if (v.status !== "cumprida" && v.dataLimite) {
            const dataLimite = new Date(v.dataLimite + "T00:00:00");
            const statusReal = (hoje > dataLimite) ? "vencida" : "pendente";
            if (statusReal !== v.status) {
                try {
                    await db.collection("veiculos").doc(v.id).update({ status: statusReal });
                } catch (err) {
                    console.warn("Não foi possível atualizar status automático:", err);
                }
                v.status = statusReal;
            }
        }
    }

    // 🔹 Antes de preencher, limpamos a tabela para não duplicar
    vehicleTableBody.innerHTML = "";

    // 🔹 Ordenação inicial: vencida > pendente > cumprida
    veiculos.sort((a, b) => {
        const ordem = { vencida: 1, pendente: 2, cumprida: 3 };
        return ordem[a.status] - ordem[b.status];
    });

    // 🔹 Se o usuário clicou para inverter a ordem, aplicamos aqui
    if (!sortStatusAsc) veiculos.reverse();

    // Preencher a tabela
    veiculos.forEach(v => {
        const tr = document.createElement("tr");
        if (v.status === "pendente") tr.style.backgroundColor = "#fff3cd";
        else if (v.status === "vencida") tr.style.backgroundColor = "#f8d7da";
        else if (v.status === "cumprida") tr.style.backgroundColor = "#d4edda";

        tr.innerHTML = `
            <td>${v.dataNotificacao}</td>
            <td>${v.marca}</td>
            <td>${v.modelo}</td>
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

    // === Integração com a dashboard ===
    const pendingNotifications = veiculos
        .filter(v => v.status === "pendente" || v.status === "vencida")
        .map(v => ({
            message: `Veículo ${v.placa || ""} — ${v.marca || ""} ${v.modelo || ""} (${v.status})`,
            link: `tools/abandoned_vehicles/vehicles.html?id=${v.id}`
        }));

    if (window.addModuleNotifications) {
        window.addModuleNotifications("veiculos", pendingNotifications);
    }
}

// ========================
// CRUD
// ========================
window.marcarCumprida = async (id) => {
    const ref = db.collection("veiculos").doc(id);
    const doc = await ref.get();

    if (!doc.exists) return;

    const data = doc.data();
    const currentStatus = data.status;

    if (currentStatus === "cumprida") {
        // Recalcular status real a partir da data limite
        const hoje = new Date();
        const dataLimite = new Date(data.dataLimite);
        let statusReal = "pendente";
        if (hoje > dataLimite) statusReal = "vencida";

        await ref.update({
            status: statusReal,
            statusAnterior: firebase.firestore.FieldValue.delete()
        });
    } else {
        // Salvar status atual e marcar como cumprida
        await ref.update({
            statusAnterior: currentStatus,
            status: "cumprida"
        });
    }

    carregarVeiculos();
};


window.editarVeiculo = async (id) => {
    const doc = await db.collection("veiculos").doc(id).get();
    const v = doc.data();

    document.getElementById("dataNotificacao").value = v.dataNotificacao;
    document.getElementById("marca").value = v.marca;
    document.getElementById("modelo").value = v.modelo;
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
if (ordenarStatusBtn) {
    ordenarStatusBtn.addEventListener("click", () => {
        sortStatusAsc = !sortStatusAsc;
        carregarVeiculos();
    });
}

// ========================
// Inicialização
// ========================
document.addEventListener("DOMContentLoaded", carregarVeiculos);
