// ========================
// Variáveis principais
// ========================
const vehicleForm = document.getElementById("vehicleForm");
const vehicleTableBody = document.querySelector("#vehicleTable tbody");
const vehicleModal = document.getElementById("vehicleModal");
const addVehicleBtn = document.getElementById("addVehicleBtn");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");

const buscaInput = document.getElementById("buscaInput");
const filtroLocal = document.getElementById("filtroLocal");

const notificationIconContainer = document.getElementById("notification-icon-container");
const notificationDropdown = document.getElementById("notification-dropdown");
const notificationCountElement = document.getElementById("notification-count");
const noNotificationsMsg = document.getElementById("no-notifications");
let globalNotifications = [];

let currentVehicleId = null;

// ========================
// Funções de Gerenciamento
// ========================

// Voltar
backBtn.addEventListener("click", () => window.history.back());

// Modal
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

// Salvar veículo
vehicleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const veiculo = {
        marca: document.getElementById("marca").value,
        modelo: document.getElementById("modelo").value,
        ano: document.getElementById("ano").value,
        cor: document.getElementById("cor").value,
        placa: document.getElementById("placa").value.toUpperCase(),
        local: document.getElementById("local").value,
        prazo: parseInt(document.getElementById("prazo").value, 10),
        dataLimite: document.getElementById("dataLimite").value
    };

    try {
        if (currentVehicleId) {
            await firebase.firestore().collection("veiculos").doc(currentVehicleId).update(veiculo);
            alert("Veículo atualizado com sucesso!");
        } else {
            await firebase.firestore().collection("veiculos").add(veiculo);
            alert("Veículo adicionado com sucesso!");
        }
        carregarVeiculos();
        vehicleModal.style.display = "none";
    } catch (error) {
        console.error("Erro ao salvar veículo: ", error);
        alert("Erro ao salvar o veículo.");
    }
});

// Editar veículo
async function editarVeiculo(id) {
    try {
        const doc = await firebase.firestore().collection("veiculos").doc(id).get();
        if (doc.exists) {
            const veiculo = doc.data();
            document.getElementById("marca").value = veiculo.marca;
            document.getElementById("modelo").value = veiculo.modelo;
            document.getElementById("ano").value = veiculo.ano;
            document.getElementById("cor").value = veiculo.cor;
            document.getElementById("placa").value = veiculo.placa;
            document.getElementById("local").value = veiculo.local;
            document.getElementById("prazo").value = veiculo.prazo;
            document.getElementById("dataLimite").value = veiculo.dataLimite;

            modalTitle.textContent = "Editar Veículo";
            currentVehicleId = id;
            vehicleModal.style.display = "flex";
        }
    } catch (error) {
        console.error("Erro ao carregar veículo para edição: ", error);
        alert("Erro ao carregar veículo para edição.");
    }
}

// Excluir veículo
async function excluirVeiculo(id) {
    if (confirm("Tem certeza que deseja excluir este veículo?")) {
        try {
            await firebase.firestore().collection("veiculos").doc(id).delete();
            alert("Veículo excluído com sucesso!");
            carregarVeiculos();
        } catch (error) {
            console.error("Erro ao excluir veículo: ", error);
            alert("Erro ao excluir veículo.");
        }
    }
}

// Carregar veículos do Firestore
async function carregarVeiculos() {
    vehicleTableBody.innerHTML = '<tr><td colspan="9">Carregando...</td></tr>';
    const termoBusca = buscaInput.value.toLowerCase();
    const filtro = filtroLocal.value;
    const locais = new Set();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    try {
        const snapshot = await firebase.firestore().collection("veiculos").get();
        const veiculos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const veiculosFiltrados = veiculos.filter(v => {
            const matchesBusca =
                (v.marca && v.marca.toLowerCase().includes(termoBusca)) ||
                (v.modelo && v.modelo.toLowerCase().includes(termoBusca)) ||
                (v.placa && v.placa.toLowerCase().includes(termoBusca));
            const matchesFiltro = !filtro || v.local === filtro;
            return matchesBusca && matchesFiltro;
        });

        // Limpar e preencher a tabela
        vehicleTableBody.innerHTML = '';
        if (veiculosFiltrados.length === 0) {
            vehicleTableBody.innerHTML = '<tr><td colspan="9">Nenhum veículo encontrado.</td></tr>';
        } else {
            veiculosFiltrados.forEach(veiculo => {
                const row = vehicleTableBody.insertRow();
                let isHighlight = false;
                if (veiculo.dataLimite) {
                    const dataLimite = new Date(veiculo.dataLimite + "T00:00:00");
                    const diffDays = Math.ceil((dataLimite - hoje) / (1000 * 60 * 60 * 24));
                    if (diffDays <= veiculo.prazo) {
                        isHighlight = true;
                    }
                }
                if (isHighlight) {
                    row.classList.add('highlight');
                }

                row.innerHTML = `
                    <td>${veiculo.marca}</td>
                    <td>${veiculo.modelo}</td>
                    <td>${veiculo.ano}</td>
                    <td>${veiculo.cor}</td>
                    <td>${veiculo.placa}</td>
                    <td>${veiculo.local}</td>
                    <td>${veiculo.prazo} dias</td>
                    <td>${new Date(veiculo.dataLimite + 'T00:00:00').toLocaleDateString()}</td>
                    <td>
                        <button class="icon-btn" onclick="editarVeiculo('${veiculo.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="icon-btn delete" onclick="excluirVeiculo('${veiculo.id}')"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                `;
            });
        }

        // Preencher o filtro de locais
        snapshot.docs.forEach(doc => {
            const local = doc.data().local;
            if (local) locais.add(local);
        });
        filtroLocal.innerHTML = '<option value="">Todos os locais</option>';
        locais.forEach(local => {
            const option = document.createElement("option");
            option.value = local;
            option.textContent = local;
            filtroLocal.appendChild(option);
        });
        if (filtro) filtroLocal.value = filtro;

        atualizarNotificacoes(veiculos);
    } catch (error) {
        console.error("Erro ao carregar veículos: ", error);
        vehicleTableBody.innerHTML = '<tr><td colspan="9">Erro ao carregar os dados.</td></tr>';
    }
}

// ========================
// Notificações
// ========================
function renderNotifications() {
    notificationDropdown.innerHTML = '';
    if (globalNotifications.length === 0) {
        notificationDropdown.innerHTML = `<p class="no-notifications" id="no-notifications">Nenhuma notificação</p>`;
        notificationCountElement.textContent = '0';
        notificationCountElement.style.display = 'none';
    } else {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        globalNotifications.forEach(notif => {
            const div = document.createElement('div');
            div.className = 'notification-item';

            const dataLimite = new Date(notif.dataLimite + "T00:00:00");
            const diffDays = Math.ceil((dataLimite - hoje) / (1000 * 60 * 60 * 24));
            const diasTexto = diffDays < 0 ? `Vencido há ${Math.abs(diffDays)} dia(s)` : `Faltam ${diffDays} dia(s)`;
            const veiculoInfo = `${notif.marca} ${notif.modelo} - Placa: ${notif.placa}`;
            div.innerHTML = `
                <p><strong>Prazo de Retirada:</strong></p>
                <p>${veiculoInfo} - ${diasTexto}</p>
            `;
            notificationDropdown.appendChild(div);
        });

        notificationCountElement.textContent = globalNotifications.length;
        notificationCountElement.style.display = 'flex';
    }
}

function atualizarNotificacoes(veiculos) {
    const hoje = new Date();
    const alertas = veiculos.filter(v => {
        const limite = new Date(v.dataLimite);
        const diff = (limite - hoje) / (1000 * 60 * 60 * 24);
        return diff <= v.prazo;
    });

    globalNotifications = alertas;
    renderNotifications();
}

// Botão sino + clique fora
notificationIconContainer.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationDropdown.classList.toggle('active');
});

document.addEventListener('click', (e) => {
    if (!notificationDropdown.contains(e.target) && !notificationIconContainer.contains(e.target)) {
        notificationDropdown.classList.remove('active');
    }
});

// Inicialização
document.addEventListener("DOMContentLoaded", carregarVeiculos);
buscaInput.addEventListener("input", carregarVeiculos);
filtroLocal.addEventListener("change", carregarVeiculos);