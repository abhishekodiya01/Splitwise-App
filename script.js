const registerForm = document.getElementById('registerForm');
const passwordField = document.getElementById('password');
const confirmPasswordField = document.getElementById('confirmPassword');
const passwordFeedback = document.getElementById('passwordFeedback');

function isStrongPassword(password) {
    const strongPasswordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&#^()_+{}\[\]:;<>,.?/~\-]).{8,}$/;
    return strongPasswordRegex.test(password);
}

function validatePasswordStrength() {
    if (!isStrongPassword(passwordField.value)) {
        const message = 'Password is not strong. Use at least 8 characters, including uppercase, lowercase, number, and special character.';
        passwordField.setCustomValidity(message);
        passwordFeedback.textContent = message;
        passwordFeedback.style.color = '#ffbaba';
    } else {
        passwordField.setCustomValidity('');
        passwordFeedback.textContent = 'Password looks strong.';
        passwordFeedback.style.color = '#b7ffd0';
    }
}

function validatePasswordMatch() {
    if (passwordField.value !== confirmPasswordField.value) {
        confirmPasswordField.setCustomValidity('Passwords do not match.');
    } else {
        confirmPasswordField.setCustomValidity('');
    }
}

if (registerForm) {
    passwordField.addEventListener('input', () => {
        validatePasswordStrength();
        if (confirmPasswordField.value) {
            validatePasswordMatch();
        }
    });

    confirmPasswordField.addEventListener('input', validatePasswordMatch);

    registerForm.addEventListener('submit', (event) => {
        validatePasswordStrength();
        validatePasswordMatch();

        if (!registerForm.checkValidity()) {
            event.preventDefault();
            registerForm.reportValidity();
        }
    });
}

// Password visibility login page
const togglePasswordLogin = document.getElementById('togglePasswordLogin');
const togglePasswordRegister = document.getElementById('togglePasswordRegister');

if (togglePasswordLogin) {
    togglePasswordLogin.addEventListener('click', (e) => {
        e.preventDefault();
        const passwordInput = document.getElementById('password');
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePasswordLogin.classList.toggle('active');
    });
}

if (togglePasswordRegister) {
    togglePasswordRegister.addEventListener('click', (e) => {
        e.preventDefault();
        const passwordInput = document.getElementById('password');
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePasswordRegister.classList.toggle('active');
    });
}
