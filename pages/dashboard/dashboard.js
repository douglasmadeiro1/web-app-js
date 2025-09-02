// dashboard.js
function logout() {
  firebase.auth().signOut()
    .then(() => {
      console.log("Logout realizado com sucesso.");
      window.location.href = "../../index.html";  
    })
    .catch((error) => {
      console.error("Erro ao sair:", error);
      alert("Erro ao sair");
    });
}

const toggleBtn = document.getElementById("toggle-theme");
const body = document.body;

// Aplica o tema salvo
if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark");
  toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
} else {
  toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
}

// Alterna tema
toggleBtn.addEventListener("click", () => {
  body.classList.toggle("dark");

  const isDark = body.classList.contains("dark");

  toggleBtn.innerHTML = isDark
    ? '<i class="fas fa-sun"></i>'
    : '<i class="fas fa-moon"></i>';

  localStorage.setItem("theme", isDark ? "dark" : "light");
});

if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
}