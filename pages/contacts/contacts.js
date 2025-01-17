function back() {
    window.location.href = "../dashboard/dashboard.html";
}

var db = firebase.firestore(); // Inicializa o Firestore
var contactsRef = db.collection("contacts"); // Referência para a coleção "contacts"


var contactForm = document.getElementById('contact-form');
var contacts = document.getElementById('contacts');

contactForm.addEventListener("submit", e => {
    e.preventDefault();

    var name = document.getElementById('name');
    var phone1 = document.getElementById('phone-number-1');
    var phone2 = document.getElementById('phone-number-2');
    var phone3 = document.getElementById('phone-number-3');
    var phone4 = document.getElementById('phone-number-4');
    var address = document.getElementById('address');
    var hiddenId = document.getElementById('hiddenId');


    var id = hiddenId && hiddenId.value ? hiddenId.value : contactsRef.doc().id;


    contactsRef.doc(id).set({
        name: name.value,
        phone1: phone1.value,
        phone2: phone2.value,
        phone3: phone3.value,
        phone4: phone4.value,
        address: address.value
    }).then(() => {
        name.value = '';
        phone1.value = '';
        phone2.value = '';
        phone3.value = '';
        phone4.value = '';
        address.value = '';

        hiddenId.value = ''; // Limpar o hiddenId após o envio
        loadContacts(); // Atualizar a lista de contatos
    }).catch((error) => {
        console.error("Erro ao salvar o contato: ", error);
    });
});

function loadContacts() {
    contacts.innerHTML = '';
    contactsRef.get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            var contact = doc.data();
            var id = doc.id;

            var li = document.createElement('li');

            li.innerHTML = `
                <span>${contact.name}</span>
                <span>${contact.phone1}</span>
                <span>${contact.phone2}</span>
                <span>${contact.phone3}</span>
                <span>${contact.phone4}</span>
                <span>${contact.address}</span>
                <div>
                    <button class="edit"><i class="fas fa-edit"></i></button>
                    <button class="delete"><i class="fas fa-trash"></i></button>
                </div>
            `;

            // Adiciona os botões de ação
            li.querySelector('.edit').onclick = function() {
                editContact(id, contact);
            };
            li.querySelector('.delete').onclick = function() {
                deleteContact(id);
            };

            contacts.appendChild(li);
        });
    }).catch(function(error) {
        console.error("Erro ao carregar os contatos: ", error);
    });
}

// Função para editar um contato
function editContact(id, contact) {
    var name = document.getElementById('name');
    var phone1 = document.getElementById('phone-number-1');
    var phone2 = document.getElementById('phone-number-2');
    var phone3 = document.getElementById('phone-number-3');
    var phone4 = document.getElementById('phone-number-4');
    var address = document.getElementById('address');
    var hiddenId = document.getElementById('hiddenId');
    var submitButton = document.querySelector('button[type="submit"]');

    // Preencher o formulário com os dados do contato
    name.value = contact.name;
    phone1.value = contact.phone1;
    phone2.value = contact.phone2;
    phone3.value = contact.phone3;
    phone4.value = contact.phone4;
    address.value = contact.address;

    // Definir o hiddenId com o id do contato
    hiddenId.value = id;

    // Alterar o texto do botão para "Salvar" durante a edição
    submitButton.textContent = 'Salvar';
}

// Função para excluir um contato
function deleteContact(id) {
    contactsRef.doc(id).delete().then(function() {
        loadContacts(); // Atualizar lista após a exclusão
    }).catch(function(error) {
        console.error('Erro ao excluir contato:', error);
    });
}

// Carregar contatos ao iniciar
loadContacts();
