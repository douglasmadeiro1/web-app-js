function back() {
    window.location.href = "../dashboard/dashboard.html";
}

var db = firebase.firestore(); // Inicializa o Firestore
var placesRef = db.collection("places"); // Referência para a coleção "places"

var placesForm = document.getElementById('places-form');
var placesList = document.getElementById('places-list');
var hiddenId = document.getElementById('hiddenId');

// Adicionar ou editar patrimônio
placesForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const id = hiddenId.value || placesRef.doc().id;

    var data = {
        number: document.getElementById("number").value,
        name: document.getElementById("name").value,
        adm1: document.getElementById("adm-1").value,
        phoneAdm1Main: document.getElementById("phone-adm-1-main").value,
        phoneAdm1Secondary: document.getElementById("phone-adm-1-secondary").value,
        adm2: document.getElementById("adm-2").value,
        phoneAdm2Main: document.getElementById("phone-adm-2-main").value,
        phoneAdm2Secondary: document.getElementById("phone-adm-2-secondary").value,
        securityPassword: document.getElementById("security-password").value,
        address: document.getElementById("address").value,
        obs: document.getElementById("obs").value,
    };

    placesRef
        .doc(id)
        .set(data)
        .then(() => {
            placesForm.reset();
            hiddenId.value = ""; // Limpar o hiddenId após o envio
            const submitButton = document.getElementById("submit-button");
            if (submitButton) {
                submitButton.textContent = "Adicionar";
            }
            loadPlaces(); // Atualizar a lista de patrimônios
        })
        .catch((error) => console.error("Erro ao salvar o patrimônio: ", error));
});

// Carregar patrimônios
function loadPlaces() {
    placesList.innerHTML = '';
    placesRef
        .get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                const place = doc.data();
                const id = doc.id;

                const li = document.createElement("li");
                li.innerHTML = `
                    <span>${place.number}</span>
                    <span>${place.name}</span>
                    <span>${place.adm1}</span>
                    <span>${place.phoneAdm1Main}</span>
                    <span>${place.phoneAdm1Secondary}</span>
                    <span>${place.adm2}</span>
                    <span>${place.phoneAdm2Main}</span>
                    <span>${place.phoneAdm2Secondary}</span>
                    <span>${place.securityPassword}</span>
                    <span>${place.address}</span>
                    <span>${place.obs}</span>
                    <div>
                        <button class="edit" data-id="${id}" data-place='${JSON.stringify(place)}'><i class="fas fa-edit"></i></button>
                        <button class="delete" data-id="${id}"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                placesList.appendChild(li);
            });

            // Adicionar evento de clique nos botões "Editar"
            document.querySelectorAll(".edit").forEach((button) => {
                button.addEventListener("click", (event) => {
                    const id = button.getAttribute("data-id");
                    const place = JSON.parse(button.getAttribute("data-place"));
                    editPlace(id, place);
                });
            });

            // Adicionar evento de clique nos botões "Excluir"
            document.querySelectorAll(".delete").forEach((button) => {
                button.addEventListener("click", (event) => {
                    const id = button.getAttribute("data-id");
                    deletePlace(id);
                });
            });
        })
        .catch((error) => console.error("Erro ao carregar os patrimônios: ", error));
}

// Editar patrimônio
function editPlace(id, place) {
    document.getElementById("number").value = place.number || "";
    document.getElementById("name").value = place.name || "";
    document.getElementById("adm-1").value = place.adm1 || "";
    document.getElementById("phone-adm-1-main").value = place.phoneAdm1Main || "";
    document.getElementById("phone-adm-1-secondary").value = place.phoneAdm1Secondary || "";
    document.getElementById("adm-2").value = place.adm2 || "";
    document.getElementById("phone-adm-2-main").value = place.phoneAdm2Main || "";
    document.getElementById("phone-adm-2-secondary").value = place.phoneAdm2Secondary || "";
    document.getElementById("security-password").value = place.securityPassword || "";
    document.getElementById("address").value = place.address || "";
    document.getElementById("obs").value = place.obs || "";
    hiddenId.value = id;

    const submitButton = document.getElementById("submit-button");
    if (submitButton) {
        submitButton.textContent = "Salvar";
    }
}

// Excluir patrimônio
function deletePlace(id) {
    placesRef
        .doc(id)
        .delete()
        .then(() => loadPlaces())
        .catch((error) => console.error("Erro ao excluir patrimônio:", error));
}

function filterPlaces() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    // Limpar a lista atual
    placesList.innerHTML = '';

    // Realizar a consulta no Firestore com base no termo de pesquisa
    placesRef
        .get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                const place = doc.data();
                const id = doc.id;

                // Verifica se o termo de pesquisa está no nome ou no número do patrimônio
                if (
                    place.name.toLowerCase().includes(searchTerm) ||
                    place.number.toString().includes(searchTerm)
                ) {
                    const li = document.createElement("li");
                    li.innerHTML = `
                        <span>${place.number}</span>
                        <span>${place.name}</span>
                        <span>${place.adm1}</span>
                        <span>${place.phoneAdm1Main}</span>
                        <span>${place.phoneAdm1Secondary}</span>
                        <span>${place.adm2}</span>
                        <span>${place.phoneAdm2Main}</span>
                        <span>${place.phoneAdm2Secondary}</span>
                        <span>${place.securityPassword}</span>
                        <span>${place.address}</span>
                        <span>${place.obs}</span>
                        <div>
                            <button class="edit"><i class="fas fa-edit"></i></button>
                            <button class="delete"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                    placesList.appendChild(li);
                }
            });

            // Adicionar evento de clique nos botões "Editar"
            document.querySelectorAll(".edit").forEach((button) => {
                button.addEventListener("click", (event) => {
                    const id = button.getAttribute("data-id");
                    const place = JSON.parse(button.getAttribute("data-place"));
                    editPlace(id, place);
                });
            });
        })
        .catch((error) => console.error("Erro ao carregar os patrimônios: ", error));
}
// Carregar na inicialização
loadPlaces();
