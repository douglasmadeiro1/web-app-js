function logout() {
  firebase.auth().signOut()
    .then(() => window.location.href = "../index.html")
    .catch((error) => alert("Erro ao sair: " + error.message));
}

function voltarParaDashboard() {
  abrirDashboard();
}