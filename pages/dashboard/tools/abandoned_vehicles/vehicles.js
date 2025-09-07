const vehicleForm = document.getElementById("vehicleForm");
const vehicleTableBody = document.querySelector("#vehicleTable tbody");
const vehicleModal = document.getElementById("vehicleModal");
const addVehicleBtn = document.getElementById("addVehicleBtn");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");

const buscaInput = document.getElementById("buscaInput");
const filtroLocal = document.getElementById("filtroLocal");

const notificationBtn = document.getElementById("notificationBtn");
const notificationDropdown = document.getElementById("notificationDropdown");
const notificationList = document.getElementById("notificationList");
const markAsReadBtn = document.getElementById("markAsReadBtn");
const backBtn = document.getElementById("backBtn");

let currentVehicleId = null;

// Voltar
backBtn.addEventListener("click", ()=> window.history.back());

// Modal
addVehicleBtn.addEventListener("click", () => {
    vehicleForm.reset();
    modalTitle.textContent = "Adicionar Veículo";
    currentVehicleId = null;
    vehicleModal.style.display = "flex";
});

closeModal.addEventListener("click", () => vehicleModal.style.display = "none");
window.addEventListener("click", e => {
    if(e.target === vehicleModal) vehicleModal.style.display = "none";
});

// Salvar veículo
vehicleForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const veiculo = {
        marca: document.getElementById("marca").value,
        modelo: document.getElementById("modelo").value,
        ano: parseInt(document.getElementById("ano").value),
        cor: document.getElementById("cor").value,
        placa: document.getElementById("placa").value,
        local: document.getElementById("local").value,
        prazo: parseInt(document.getElementById("prazo").value),
        dataLimite: document.getElementById("dataLimite").value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if(currentVehicleId){
            await db.collection("veiculos").doc(currentVehicleId).update(veiculo);
            alert("Veículo atualizado!");
        } else {
            await db.collection("veiculos").add(veiculo);
            alert("Veículo adicionado!");
        }
        vehicleModal.style.display="none";
        carregarVeiculos();
    } catch(err){
        console.error(err);
        alert("Erro ao salvar veículo");
    }
});

// Carregar veículos
async function carregarVeiculos(){
    vehicleTableBody.innerHTML="";
    filtroLocal.innerHTML='<option value="">Todos os locais</option>';
    const snapshot = await db.collection("veiculos").orderBy("createdAt","desc").get();
    let veiculos=[];
    snapshot.forEach(doc=>{
        veiculos.push({id:doc.id,...doc.data()});
        if(![...filtroLocal.options].some(o=>o.value===doc.data().local)){
            let opt = document.createElement("option");
            opt.value=doc.data().local;
            opt.textContent=doc.data().local;
            filtroLocal.appendChild(opt);
        }
    });

    const busca = buscaInput.value.toLowerCase();
    const filtro = filtroLocal.value;

    veiculos.filter(v=>{
        const matchBusca = v.marca.toLowerCase().includes(busca) || v.modelo.toLowerCase().includes(busca) || v.placa.toLowerCase().includes(busca);
        const matchFiltro = filtro==="" || v.local===filtro;
        return matchBusca && matchFiltro;
    }).forEach(v=>{
        let row = document.createElement("tr");
        // linha em destaque se prazo estiver próximo
        const limite = new Date(v.dataLimite);
        const hoje = new Date();
        const diff = (limite-hoje)/(1000*60*60*24);
        if(diff<=v.prazo) row.classList.add("highlight");

        row.innerHTML=`
            <td>${v.marca}</td>
            <td>${v.modelo}</td>
            <td>${v.ano}</td>
            <td>${v.cor}</td>
            <td>${v.placa}</td>
            <td>${v.local}</td>
            <td>${v.prazo}</td>
            <td>${v.dataLimite}</td>
            <td>
                <button class="icon-btn edit-btn" data-id="${v.id}"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="icon-btn delete-btn" data-id="${v.id}"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        vehicleTableBody.appendChild(row);
    });

    // Editar/Excluir
    document.querySelectorAll(".edit-btn").forEach(btn=>{
        btn.addEventListener("click", async ()=>{
            currentVehicleId = btn.dataset.id;
            const doc = await db.collection("veiculos").doc(currentVehicleId).get();
            const v = doc.data();
            modalTitle.textContent="Editar Veículo";
            document.getElementById("marca").value=v.marca;
            document.getElementById("modelo").value=v.modelo;
            document.getElementById("ano").value=v.ano;
            document.getElementById("cor").value=v.cor;
            document.getElementById("placa").value=v.placa;
            document.getElementById("local").value=v.local;
            document.getElementById("prazo").value=v.prazo;
            document.getElementById("dataLimite").value=v.dataLimite;
            vehicleModal.style.display="flex";
        });
    });

    document.querySelectorAll(".delete-btn").forEach(btn=>{
        btn.addEventListener("click", async ()=>{
            if(confirm("Deseja realmente excluir este veículo?")){
                await db.collection("veiculos").doc(btn.dataset.id).delete();
                carregarVeiculos();
            }
        });
    });

    atualizarNotificacoes(veiculos);
}

// Busca/filtro
buscaInput.addEventListener("input", carregarVeiculos);
filtroLocal.addEventListener("change", carregarVeiculos);

// Notificações
notificationBtn.addEventListener("click", e=>{
    e.stopPropagation();
    notificationDropdown.style.display = notificationDropdown.style.display==="block"?"none":"block";
});

// Marcar como lido
markAsReadBtn.addEventListener("click", ()=>{
    notificationList.innerHTML="<li>Não há notificações</li>";
    markAsReadBtn.textContent="CIENTE";
    notificationCount.textContent="0";
});

// Fechar dropdown clicando fora
document.addEventListener("click", ()=>{ notificationDropdown.style.display="none"; });

// Atualiza notificações
function atualizarNotificacoes(veiculos){
    const hoje = new Date();
    const alertas = veiculos.filter(v=>{
        const limite = new Date(v.dataLimite);
        const diff = (limite-hoje)/(1000*60*60*24);
        return diff<=v.prazo;
    });

    notificationCount.textContent=alertas.length;
    notificationList.innerHTML="";
    if(alertas.length===0){
        notificationList.innerHTML="<li>Não há notificações</li>";
        markAsReadBtn.textContent="CIENTE";
    } else {
        alertas.forEach(a=>{
            notificationList.innerHTML+=`<li>Veículo ${a.marca} ${a.modelo} está próximo do prazo.</li>`;
        });
        markAsReadBtn.textContent="CIENTE";
    }
}

// Inicial
carregarVeiculos();
