function validateEmail(email) {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    return emailRegex.test(email);
}
