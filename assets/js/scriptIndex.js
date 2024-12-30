const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
});




/*
// FUNÇÃO QUE CHAMA AS FUNÇÕES DE VALIDAÇÃO DO EMAIL
function onChangeEmail() {
    toggleButtonDisable();
    toggleEmailErrors();
}

// FUNÇÃO QUE CHAMA AS FUNÇÕES DE VALIDAÇÃO DA SENHA
function onChangePassword() {
    toggleButtonDisable();
    togglePasswordError();
}

// FUNÇÃO PARA VERIFICAR SE O VALOR DO CAMPO EMAIL É VALIDO
function isEmailValid () {
    const email = form.email().value;
    if (!email) {
        return false;
    }
    return validateEmail(email);
} 

// FUNÇÃO PARA FORNECER FEEDBACK PARA O USUÁRIO ACERCA DE ERROS NO CAMPO EMAIL
function toggleEmailErrors() {
    const email = form.email().value;
    form.emailRequiredError().style.display = email ? "none" : "block";

    form.emailInvalidError().style.display = validateEmail(email) ? "none" : "block";
}

// FUNÇÃO PARA FORNECER FEEDBACK PARA O USUÁRIO ACERCA DE ERROS NO CAMPO SENHA
function togglePasswordError() {
    const password = form.password().value;
    form.passwordRequiredError().style.display = password ? "none" : "block";
}

// FUNÇÃO PARA ALTERNAR ENTRE O ESTADO DOS BOTÕES (ATIVADO OU DESATIVADO)
function toggleButtonDisable() {
    const emailValid = isEmailValid();
    form.recoverPassword().disabled = !emailValid;

    const passwordValid = isPasswordValid();
    form.loginButton().disabled = !emailValid || !passwordValid;
}

// FUNÇÃO PARA VERIFICAR SE O VALOR DO CAMPO EMAIL É VALIDO
function isPasswordValid() {
    const password = form.password().value;
    if (!password) {
        return false;
    }
    return true;
}

// FUNÇÃO PARA VALIDAR O EMAIL
function validateEmail(email) {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    return emailRegex.test(email);
}

const form = {
    email: () => document.getElementById('email'),
    emailRequiredError: () => document.getElementById('email-required-error'),
    emailInvalidError: () => document.getElementById('email-invalid-error'),
    loginButton: () => document.getElementById('login-button'),
    password: () => document.getElementById('password'),
    passwordRequiredError: () => document.getElementById('password-required-error'),
    recoverPassword: () => document.getElementById('recover-password-button')
}
*/