function back() {
    window.location.href = "../dashboard/dashboard.html";
}

var db = firebase.firestore();
var contactsRef = db.collection("contacts");


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

        hiddenId.value = '';
        loadContacts();
    }).catch((error) => {
        console.error("Erro ao salvar o contato: ", error);
    });
});

function loadContacts(filter = "") {
    contacts.innerHTML = '';

    contactsRef.orderBy("name").get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            var contact = doc.data();
            var id = doc.id;

            if (
                contact.name.toLowerCase().includes(filter.toLowerCase()) ||
                contact.phone1.toLowerCase().includes(filter.toLowerCase()) ||
                (contact.phone2 && contact.phone2.toLowerCase().includes(filter.toLowerCase())) ||
                (contact.phone3 && contact.phone3.toLowerCase().includes(filter.toLowerCase())) ||
                (contact.phone4 && contact.phone4.toLowerCase().includes(filter.toLowerCase()))
            ) {
                var li = document.createElement('li');

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

                li.querySelector('.edit').onclick = function () {
                    editContact(id, contact);
                };
                li.querySelector('.delete').onclick = function () {
                    deleteContact(id);
                };

                contacts.appendChild(li);
            }
        });
    }).catch(function (error) {
        console.error("Erro ao carregar os contatos: ", error);
    });
}

var searchInput = document.getElementById('search-input');


searchInput.addEventListener("input", (e) => {
    const filter = e.target.value.trim();
    loadContacts(filter);
});

function editContact(id, contact) {
    var name = document.getElementById('name');
    var phone1 = document.getElementById('phone-number-1');
    var phone2 = document.getElementById('phone-number-2');
    var phone3 = document.getElementById('phone-number-3');
    var phone4 = document.getElementById('phone-number-4');
    var address = document.getElementById('address');
    var hiddenId = document.getElementById('hiddenId');
    var submitButton = document.querySelector('button[type="submit"]');

    name.value = contact.name;
    phone1.value = contact.phone1;
    phone2.value = contact.phone2;
    phone3.value = contact.phone3;
    phone4.value = contact.phone4;
    address.value = contact.address;

    hiddenId.value = id;

    submitButton.textContent = 'Salvar';
}

function deleteContact(id) {
    contactsRef.doc(id).delete().then(function () {
        loadContacts(); 
    }).catch(function (error) {
        console.error('Erro ao excluir contato:', error);
    });
}

loadContacts();
