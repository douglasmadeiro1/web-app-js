// Botão de voltar
function back() {
    window.location.href = "../dashboard/dashboard.html";
}

// Referências do DOM
const placesForm = document.getElementById('places-form');
const placesList = document.getElementById('places-list');
const searchInput = document.getElementById('place-search-input');

const numberInput = document.getElementById('place-number');
const areaInput = document.getElementById('place-area');
const nameInput = document.getElementById('place-name');
const adm1Input = document.getElementById('place-adm1');
const phoneAdm1MainInput = document.getElementById('place-phone-adm1-main');
const phoneAdm1SecondaryInput = document.getElementById('place-phone-adm1-secondary');
const adm2Input = document.getElementById('place-adm2');
const phoneAdm2MainInput = document.getElementById('place-phone-adm2-main');
const phoneAdm2SecondaryInput = document.getElementById('place-phone-adm2-secondary');
const securityPasswordInput = document.getElementById('place-security-password');
const addressInput = document.getElementById('place-address');
const obsInput = document.getElementById('place-obs');
const hiddenIdInput = document.getElementById('place-hiddenId');
const submitButton = document.getElementById('place-submit-button');

const placesRef = db.collection("places");

// Adicionar ou editar patrimônio
placesForm.addEventListener("submit", e => {
    e.preventDefault();

    const id = hiddenIdInput.value || placesRef.doc().id;

    const data = {
        number: numberInput.value.trim(),
        area: areaInput.value.trim(),
        name: nameInput.value.trim(),
        adm1: adm1Input.value.trim(),
        phoneAdm1Main: phoneAdm1MainInput.value.trim(),
        phoneAdm1Secondary: phoneAdm1SecondaryInput.value.trim(),
        adm2: adm2Input.value.trim(),
        phoneAdm2Main: phoneAdm2MainInput.value.trim(),
        phoneAdm2Secondary: phoneAdm2SecondaryInput.value.trim(),
        securityPassword: securityPasswordInput.value.trim(),
        address: addressInput.value.trim(),
        obs: obsInput.value.trim(),
    };

    placesRef.doc(id).set(data)
        .then(() => {
            resetForm();
            loadPlaces();
        })
        .catch(err => console.error("Erro ao salvar patrimônio:", err));
});

// Carregar patrimônios
function loadPlaces(filter = "") {
    placesList.innerHTML = '';

    placesRef.get()
        .then(snapshot => {
            const fragment = document.createDocumentFragment();

            snapshot.forEach(doc => {
                const place = doc.data();
                const id = doc.id;

                const searchText = filter.toLowerCase();
                if (place.name.toLowerCase().includes(searchText) ||
                    place.number.toString().includes(filter)
                ) {
                    const li = document.createElement("li");
                    const mapsLink = `https://www.google.com/maps?q=${encodeURIComponent(place.address)}`;

                    li.innerHTML = `
                        <span>${place.number}</span>
                        <span>${place.area}</span>
                        <span>${place.name}</span>
                        <span>${place.adm1}</span>
                        <span>${place.phoneAdm1Main}</span>
                        <span>${place.phoneAdm1Secondary}</span>
                        <span>${place.adm2}</span>
                        <span>${place.phoneAdm2Main}</span>
                        <span>${place.phoneAdm2Secondary}</span>
                        <span>${place.securityPassword}</span>
                        <span><a href="${mapsLink}" target="_blank">${place.address}</a></span>
                        <span>${place.obs}</span>
                        <div>
                            <button class="edit" data-id="${id}" data-place='${JSON.stringify(place)}'>
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete" data-id="${id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    fragment.appendChild(li);
                }
            });

            placesList.appendChild(fragment);

            // Adicionar eventos aos botões
            fragment.querySelectorAll(".edit").forEach(button => {
                button.addEventListener("click", () => {
                    editPlace(button.dataset.id, JSON.parse(button.dataset.place));
                });
            });

            fragment.querySelectorAll(".delete").forEach(button => {
                button.addEventListener("click", () => {
                    deletePlace(button.dataset.id);
                });
            });
        })
        .catch(err => console.error("Erro ao carregar patrimônios:", err));
}

// Pesquisar patrimônio
searchInput.addEventListener("input", e => {
    loadPlaces(e.target.value.trim());
});

// Editar patrimônio
function editPlace(id, place) {
    numberInput.value = place.number || "";
    areaInput.value = place.area || "";
    nameInput.value = place.name || "";
    adm1Input.value = place.adm1 || "";
    phoneAdm1MainInput.value = place.phoneAdm1Main || "";
    phoneAdm1SecondaryInput.value = place.phoneAdm1Secondary || "";
    adm2Input.value = place.adm2 || "";
    phoneAdm2MainInput.value = place.phoneAdm2Main || "";
    phoneAdm2SecondaryInput.value = place.phoneAdm2Secondary || "";
    securityPasswordInput.value = place.securityPassword || "";
    addressInput.value = place.address || "";
    obsInput.value = place.obs || "";
    hiddenIdInput.value = id;

    submitButton.textContent = "Salvar";
}

// Excluir patrimônio
function deletePlace(id) {
    if (confirm("Deseja realmente excluir este patrimônio?")) {
        placesRef.doc(id).delete()
            .then(() => loadPlaces())
            .catch(err => console.error("Erro ao excluir patrimônio:", err));
    }
}

// Resetar formulário
function resetForm() {
    placesForm.reset();
    hiddenIdInput.value = '';
    submitButton.textContent = 'Adicionar';
}

// Carregar ao iniciar
loadPlaces();
