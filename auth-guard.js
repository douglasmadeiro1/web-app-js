firebase.auth().onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "../../index.html";
    }
});

const TIMEOUT = 10 * 60 * 1000;
let inactivityTimer;

function resetTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        firebase.auth().signOut().then(() => {
            window.location.href = "../../index.html";
        }).catch(error => {
            console.error("Erro ao fazer logout:", error);
        });
    }, TIMEOUT);
}

const activityEvents = ["mousemove", "keydown", "click", "scroll", "input"];
activityEvents.forEach(event => {
    document.addEventListener(event, resetTimer);
});

placesForm.addEventListener("submit", resetTimer);
searchInput.addEventListener("input", resetTimer);
document.getElementById("places-list").addEventListener("click", resetTimer);

resetTimer();