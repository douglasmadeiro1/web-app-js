function stats() {
    window.location.href = "../stats/stats.html";
}

function completeStats() {
    window.location.href = "../complete_stats/complete_stats.html"
}

function contacts() {
    window.location.href = "../contacts/contacts.html";
}

function places() {
    window.location.href = "../places/places.html";
}

function files() {
    window.location.href = "../files/files.html";
}

function teamStats() {
  window.location.href = "../team_stats/team_stats.html";
}

function logout() {
    firebase.auth().signOut()
      .then(() => {
        console.log("Logout realizado com sucesso.");
        window.location.href = "../../index.html";  // Redireciona após logout
      })
      .catch((error) => {
        console.error("Erro ao sair:", error);
        alert("Erro ao sair");
      });
  }

  const toggleBtn = document.getElementById("toggle-theme");
  const body = document.body;

  // Checa se o modo escuro estava ativado anteriormente
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark");
    toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
  }

  toggleBtn.addEventListener("click", () => {
    body.classList.toggle("dark");
    const isDark = body.classList.contains("dark");
    toggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });