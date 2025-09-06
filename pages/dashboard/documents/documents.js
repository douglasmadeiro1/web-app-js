// Toggle Dark Mode
const toggleBtn = document.getElementById("toggle-theme");
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");
toggleBtn.innerHTML = document.body.classList.contains("dark") ?
  '<i class="fas fa-sun"></i>' :
  '<i class="fas fa-moon"></i>';
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  toggleBtn.innerHTML = document.body.classList.contains("dark") ?
    '<i class="fas fa-sun"></i>' :
    '<i class="fas fa-moon"></i>';
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});
function updateThemeIcon() {
  toggleBtn.innerHTML = document.body.classList.contains("dark") ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
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