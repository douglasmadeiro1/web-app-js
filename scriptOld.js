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
    if (!email) {
        form.emailRequiredError().style.display = "block";
    } else {
        form.emailRequiredError().style.display = "none";
    }
    if(validateEmail(email)) {
        form.emailInvalidError().style.display = "none";
    } else {
        form.emailInvalidError().style.display = "block";
    }
}

// FUNÇÃO PARA FORNECER FEEDBACK PARA O USUÁRIO ACERCA DE ERROS NO CAMPO SENHA
function togglePasswordError() {
    const password = form.password().value;
    if(!password) {
        form.passwordRequiredError().style.display = "block"; 
    } else {
        form.passwordRequiredError().style.display = "none"; 
    }
}

// FUNÇÃO PARA ALTERNAR ENTRE O ESTADO DOS BOTÕES (ATIVADO OU DESATIVADO)
function toggleButtonDisable() {
    const emailValid = isEmailValid();
    form.recoverPassword.disabled = !emailValid;

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