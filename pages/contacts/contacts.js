// Botão de voltar
function back() {
    window.location.href = "../dashboard/dashboard.html";
}

// Referências do DOM
const contactForm = document.getElementById('contact-form');
const contactsList = document.getElementById('contacts');
const searchInput = document.getElementById('search-input');

const nameInput = document.getElementById('contact-name');
const phone1Input = document.getElementById('contact-phone1');
const phone2Input = document.getElementById('contact-phone2');
const phone3Input = document.getElementById('contact-phone3');
const phone4Input = document.getElementById('contact-phone4');
const addressInput = document.getElementById('contact-address');
const hiddenIdInput = document.getElementById('contact-hiddenId');
const submitButton = contactForm.querySelector('button[type="submit"]');

const contactsRef = db.collection("contacts");

// Adicionar ou editar contato
contactForm.addEventListener("submit", e => {
    e.preventDefault();

    const id = hiddenIdInput.value || contactsRef.doc().id;

    contactsRef.doc(id).set({
        name: nameInput.value.trim(),
        phone1: phone1Input.value.trim(),
        phone2: phone2Input.value.trim(),
        phone3: phone3Input.value.trim(),
        phone4: phone4Input.value.trim(),
        address: addressInput.value.trim()
    }).then(() => {
        resetForm();
        loadContacts();
    }).catch(err => console.error("Erro ao salvar contato:", err));
});

// Carregar contatos do Firestore
function loadContacts(filter = "") {
    contactsList.innerHTML = '';
    contactsRef.orderBy("name").get()
        .then(snapshot => {
            const fragment = document.createDocumentFragment();

            snapshot.forEach(doc => {
                const contact = doc.data();
                const id = doc.id;

                const searchText = filter.toLowerCase();
                if (
                    contact.name.toLowerCase().includes(searchText) ||
                    contact.phone1.toLowerCase().includes(searchText) ||
                    (contact.phone2 && contact.phone2.toLowerCase().includes(searchText)) ||
                    (contact.phone3 && contact.phone3.toLowerCase().includes(searchText)) ||
                    (contact.phone4 && contact.phone4.toLowerCase().includes(searchText))
                ) {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${contact.name}</span>
                        <span>${contact.phone1}</span>
                        <span>${contact.phone2 || ""}</span>
                        <span>${contact.phone3 || ""}</span>
                        <span>${contact.phone4 || ""}</span>
                        <span>${contact.address || ""}</span>
                        <div>
                            <button class="edit"><i class="fas fa-edit"></i></button>
                            <button class="delete"><i class="fas fa-trash"></i></button>
                        </div>
                    `;

                    li.querySelector('.edit').addEventListener("click", () => editContact(id, contact));
                    li.querySelector('.delete').addEventListener("click", () => deleteContact(id));

                    fragment.appendChild(li);
                }
            });

            contactsList.appendChild(fragment);
        })
        .catch(err => console.error("Erro ao carregar contatos:", err));
}

// Editar contato
function editContact(id, contact) {
    nameInput.value = contact.name;
    phone1Input.value = contact.phone1;
    phone2Input.value = contact.phone2 || '';
    phone3Input.value = contact.phone3 || '';
    phone4Input.value = contact.phone4 || '';
    addressInput.value = contact.address || '';

    hiddenIdInput.value = id;
    submitButton.textContent = 'Salvar';
}

// Excluir contato
function deleteContact(id) {
    if (confirm("Deseja realmente excluir este contato?")) {
        contactsRef.doc(id).delete()
            .then(() => loadContacts())
            .catch(err => console.error("Erro ao excluir contato:", err));
    }
}

// Resetar formulário
function resetForm() {
    contactForm.reset();
    hiddenIdInput.value = '';
    submitButton.textContent = 'Adicionar';
}

// Pesquisar contatos
searchInput.addEventListener("input", e => {
    loadContacts(e.target.value.trim());
});

// Carregar contatos ao iniciar
loadContacts();
