import { toast } from './node_modules/mytoastfy/dist/index.js';

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const passwordField = document.getElementById('password');
const confirmPasswordField = document.getElementById('confirmPassword');
const passwordFeedback = document.getElementById('passwordFeedback');
const loginError = document.getElementById('loginError');
const registerMessage = document.getElementById('registerMessage');

function isStrongPassword(password) {
    const strongPasswordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&#^()_+{}\[\]:;<>,.?/~\-]).{8,}$/;
    return strongPasswordRegex.test(password);
}

function validatePasswordStrength() {
    if (!passwordField) return;
    if (!isStrongPassword(passwordField.value)) {
        const message = 'Password is not strong. Use at least 8 characters, including uppercase, lowercase, number, and special character.';
        passwordField.setCustomValidity(message);
        if (passwordFeedback) {
            passwordFeedback.textContent = message;
            passwordFeedback.style.color = '#ffbaba';
        }
    } else {
        passwordField.setCustomValidity('');
        if (passwordFeedback) {
            passwordFeedback.textContent = 'Password looks strong.';
            passwordFeedback.style.color = '#b7ffd0';
        }
    }
}

function validatePasswordMatch() {
    if (!confirmPasswordField) return;
    if (passwordField.value !== confirmPasswordField.value) {
        confirmPasswordField.setCustomValidity('Passwords do not match.');
    } else {
        confirmPasswordField.setCustomValidity('');
    }
}

function getStoredUsers() {
    const data = localStorage.getItem('splitwiseUsers');
    const parsed = data ? JSON.parse(data) : null;
    return parsed && Array.isArray(parsed.users) ? parsed.users : [];
}

function saveStoredUsers(users) {
    localStorage.setItem('splitwiseUsers', JSON.stringify({ users }));
}

function getStoredUser(email) {
    const users = getStoredUsers();
    return users.find((user) => user.email === email) || null;
}

if (registerForm) {
    passwordField.addEventListener('input', () => {
        validatePasswordStrength();
        if (confirmPasswordField.value) {
            validatePasswordMatch();
        }
    });

    if (confirmPasswordField) {
        confirmPasswordField.addEventListener('input', validatePasswordMatch);
    }

    registerForm.addEventListener('submit', (event) => {
        validatePasswordStrength();
        validatePasswordMatch();

        if (!registerForm.checkValidity()) {
            event.preventDefault();
            registerForm.reportValidity();
            return;
        }

        event.preventDefault();

        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = passwordField.value;

        const existingUsers = getStoredUsers();
        const existingUser = existingUsers.find((user) => user.email === email);
        if (existingUser) {
            if (registerMessage) {
                registerMessage.textContent = 'This email is already registered. Please use another email or login.';
                registerMessage.style.color = '#ffbaba';
            }
            return;
        }

        const user = {
            name: `${firstName} ${lastName}`.trim(),
            email,
            password
        };

        saveStoredUsers([...existingUsers, user]);

        toast({
            message: 'Registration successful',
            type: 'success',
            duration: 3000,
            position: 'top-right'
        });

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 900);
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = passwordField.value;
        const storedUser = getStoredUser(email);

        if (!storedUser || storedUser.password !== password) {
            const errorMessage = 'Invalid email or password. Please try again.';
            if (loginError) {
                loginError.textContent = errorMessage;
                loginError.style.color = '#ffbaba';
            }
            toast({
                message: errorMessage,
                type: 'error',
                duration: 3000,
                position: 'bottom-right'
            });
            return;
        }

        localStorage.setItem('splitwiseLoggedIn', 'true');
        localStorage.setItem('splitwiseLoggedInUser', storedUser.email);
        localStorage.setItem('splitwiseUser', JSON.stringify(storedUser));

        toast({
            message: 'Login successful',
            type: 'success',
            duration: 3000,
            position: 'top-right'
        });

        setTimeout(() => {
            window.location.href = 'home.html';
        }, 900);
    });
}

// Password visibility toggle
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

const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('splitwiseLoggedIn');
        localStorage.removeItem('splitwiseLoggedInUser');
        localStorage.removeItem('splitwiseUser');

        toast({
            message: 'You have been logged out.',
            duration: 3000,
            type: 'success',
            position: 'top-right'
        });

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 900);
    });
}

// Forgot Password Link
const forgotPasswordLink = document.querySelector('.forgot-password');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'pass.html';
    });
}

// Forgot Password Form
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value.trim().toLowerCase();
        const storedUser = getStoredUser(email);
        const resetError = document.getElementById('resetError');

        if (!storedUser) {
            const errorMessage = 'No account found with this email.';
            toast({
                message: errorMessage,
                type: 'error',
                duration: 3000,
                position: 'bottom-right'
            });
            return;
        }

        toast({
            message: `Your password is: ${storedUser.password}`,
            type: 'success',
            duration: 5000,
            position: 'top-right'
        });

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    });
}