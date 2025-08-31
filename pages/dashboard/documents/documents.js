// Toggle Dark Mode
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
});

// Persistir tema
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
}

// Abrir documento (exemplo)
function abrirDocumento(file) {
  window.open(file, "_blank");
}

// Logout
function logout() {
  firebase.auth().signOut()
    .then(() => window.location.href = "../index.html")
    .catch((error) => alert("Erro ao sair: " + error.message));
}


function back() {
    window.location.href = "../../dashboard/dashboard.html";
}