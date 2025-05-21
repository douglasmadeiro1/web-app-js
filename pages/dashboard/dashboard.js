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

function nightShift() {
    window.location.href = "../night_shift/night_shift.html";
}

function dayShift() {
    window.location.href = "../day_shift/day_shift.html";
}

function patrolReport() {
    window.location.href = "../patrol_report/patrol_report.html";
}

function patrolReportRomo() {
    window.location.href = "../patrol_report_romo/patrol_report_romo.html";
}

function reportOfManager() {
    window.location.href = "../report_of_manager/report_of_manager.html";
}

function releaseTerm() {
    window.location.href = "../release_term/release_term.html";
}

function teamStats() {
  window.location.href = "../team_stats/team_stats.html";
}

function statsByTime() {
  window.location.href = "../stats_by_time/stats_by_time.html";
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
