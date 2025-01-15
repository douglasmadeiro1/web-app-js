function back() {
    window.location.href = "../dashboard/dashboard.html";
}

var db = firebase.database();
var contactsRef = db.ref("/contacts");

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
    var hiddenId = document.getElementById('hiddenId');  // Referência ao campo oculto

    // Verificar se o hiddenId está vazio, indicando que é um novo contato
    var id = hiddenId && hiddenId.value ? hiddenId.value : contactsRef.push().key;

    // Salvar o contato no Firebase com o ID apropriado
    contactsRef.child(id).set({
        name: name.value,
        phone1: phone1.value,
        phone2: phone2.value,
        phone3: phone3.value,
        phone4: phone4.value,
        address: address.value
    });

    // Limpar os campos do formulário
    name.value = '';
    phone1.value = '';
    phone2.value = '';
    phone3.value = '';
    phone4.value = '';
    address.value = '';

    // Limpar o hiddenId após o envio (caso seja uma edição)
    hiddenId.value = '';

    // Atualizar a lista de contatos
    loadContacts();
});

// Função para carregar os contatos
function loadContacts() {
    contacts.innerHTML = ''; // Limpa a lista
    contactsRef.once("value", function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var contact = childSnapshot.val();
            var id = childSnapshot.key;
            
            // Criar um item de lista para cada contato
            var li = document.createElement('li');
            li.textContent = `${contact.name} - ${contact.phone1}`;

            // Adicionar os botões de Editar e Excluir
            var editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.onclick = function() {
                editContact(id, contact);
            };
            li.appendChild(editButton);

            var deleteButton = document.createElement('button');
            deleteButton.textContent = 'Excluir';
            deleteButton.onclick = function() {
                deleteContact(id);
            };
            li.appendChild(deleteButton);

            contacts.appendChild(li);
        });
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
    contactsRef.child(id).remove()
        .then(function() {
            loadContacts(); // Atualizar lista após a exclusão
        })
        .catch(function(error) {
            console.error('Erro ao excluir contato:', error);
        });
}

// Carregar contatos ao iniciar
loadContacts();
