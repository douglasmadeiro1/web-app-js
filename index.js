const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
});

firebase.auth().onAuthStateChanged(user => {
    if (user) {
        window.location.href = "pages/dashboard.html";
    }
})

function login() {
    const email = form.emailLogin().value;
    const password = form.passwordLogin().value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(response => {
            window.location.href = "pages/dashboard/dashboard.html";
        }).catch(error => {
            console.log(getErrorMessage(error));
        });
}

function register() {

    const email = form.emailRegister().value;
    const password = form.passwordRegister().value;
    firebase.auth().createUserWithEmailAndPassword(email, password).then(() => {
        window.location.href = "pages/dashboard.html";
    }).catch(error => {
        console.log(getErrorMessage(error));
        });
}

function recoveryPassword() {
    firebase.auth().sendPasswordResetEmail(form.emailLogin().value).then(() => {
        alert('Email de recuperação enviado com sucesso');
    }).catch(error => {
        alert('Erro ao enviar email de recuperação, verifique o email informado');
    });
}

const form = {
    emailLogin: () => document.getElementById('emailLogin'),
    passwordLogin: () => document.getElementById('passwordLogin'),
    emailRegister: () => document.getElementById('emailRegister'),
    passwordRegister: () => document.getElementById('passwordRegister'),
}

function getErrorMessage(error) {
    if (!error) {
        return "Ocorreu um erro desconhecido.";
    }

    // Verificando erros conhecidos do Firebase
    if (error.code === "auth/user-not-found") {
        return "Usuário não encontrado.";
    }
    if (error.code === "auth/wrong-password") {
        return "Senha inválida.";
    }
    if (error.code === "auth/invalid-credential") {
        return "Credenciais inválidas. Verifique seu e-mail e senha.";
    }

    // Para outros erros não especificados
    return error.message || "Erro desconhecido.";
}