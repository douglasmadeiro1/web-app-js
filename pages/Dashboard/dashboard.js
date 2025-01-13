function stats() {
    window.location.href = "../stats/stats.html";
}

function contacts() {
    window.location.href = "../contacts/contacts.html";
}

function places() {
    window.location.href = "../places/places.html";
}

function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = "../../index.html";
    }).catch(() => {
        alert("Erro ao sair")
    })
}