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
    const users = parsed && Array.isArray(parsed.users) ? parsed.users : [];
    return users.map((user) => ({
        ...user,
        pay: Number(user.pay || 0),
        receive: Number(user.receive || 0)
    }));
}

function saveStoredUsers(users) {
    localStorage.setItem('splitwiseUsers', JSON.stringify({ users }));
}

function generateId() {
    return `group_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getStoredGroups() {
    const data = localStorage.getItem('splitwiseGroups');
    const groups = data ? JSON.parse(data) : [];
    let updated = false;
    const normalized = groups.map((group) => {
        if (!group.id) {
            updated = true;
            return { ...group, id: generateId() };
        }
        return group;
    });
    if (updated) {
        saveStoredGroups(normalized);
    }
    return normalized;
}

function saveStoredGroups(groups) {
    localStorage.setItem('splitwiseGroups', JSON.stringify(groups));
}

function updateUserBalancesFromGroups() {
    const users = getStoredUsers();
    const groups = getStoredGroups();
    const balances = users.reduce((acc, user) => {
        acc[user.email] = { pay: 0, receive: 0 };
        return acc;
    }, {});

    groups.forEach((group) => {
        const totalAmount = Number(group.amount) || 0;
        const members = Array.isArray(group.members) ? group.members : [];
        const memberCount = members.length;
        if (memberCount === 0 || totalAmount <= 0) return;

        const share = totalAmount / memberCount;
        const creatorEmail = group.creatorEmail || members[0];

        members.forEach((memberEmail) => {
            if (!balances[memberEmail]) return;
            if (memberEmail === creatorEmail) {
                balances[memberEmail].receive += totalAmount - share;
            } else {
                balances[memberEmail].pay += share;
            }
        });
    });

    const updatedUsers = users.map((user) => ({
        ...user,
        pay: Number(balances[user.email]?.pay.toFixed(2) || 0),
        receive: Number(balances[user.email]?.receive.toFixed(2) || 0)
    }));
    saveStoredUsers(updatedUsers);
    return updatedUsers;
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
            password,
            pay: 0,
            receive: 0
        };

        saveStoredUsers([...existingUsers, user]);  // adding in existing users

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

        // Update balances before login
        updateUserBalancesFromGroups();
        const freshUser = getStoredUser(email);

        localStorage.setItem('splitwiseLoggedIn', 'true');
        localStorage.setItem('splitwiseLoggedInUser', freshUser.email);
        localStorage.setItem('splitwiseUser', JSON.stringify(freshUser));

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

// logout

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

// Password visibility
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


// home page
const isHomePage = window.location.pathname.endsWith('home.html') || window.location.pathname.endsWith('home.htm');
if (isHomePage) {
    const isLoggedIn = localStorage.getItem('splitwiseLoggedIn') === 'true';
    const storedUserStr = localStorage.getItem('splitwiseUser');
    if (!isLoggedIn || !storedUserStr) {
        window.location.href = 'login.html';
    } else {
        try {
            updateUserBalancesFromGroups();
            const currentUserEmail = localStorage.getItem('splitwiseLoggedInUser');
            const freshUser = getStoredUser(currentUserEmail);
            localStorage.setItem('splitwiseUser', JSON.stringify(freshUser));

            const welcomeText = document.getElementById('welcomeText');
            if (welcomeText) {
                welcomeText.textContent = `Hello, ${freshUser.name || 'User'}!`;
            }
        } catch (e) {
            window.location.href = 'login.html';
        }
    }

    const addExpenseBtn = document.querySelector('.btn-add-expense');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => {
            showCreateGroupModal();
        });
    }
}

function initializeDashboard() {
    const expensesList = document.getElementById('expensesList');
    const currentUserEmail = localStorage.getItem('splitwiseLoggedInUser');
    const groups = getStoredGroups();
    updateUserBalancesFromGroups();
    const currentUser = getStoredUser(currentUserEmail);
    const userGroups = groups.filter((group) => group.members.includes(currentUserEmail));

    if (expensesList) {
        if (userGroups.length === 0) {
            expensesList.innerHTML = '<div class="empty-state"><p>No groups yet</p></div>';
        } else {
            expensesList.innerHTML = userGroups
                .map((group) => {
                    const totalAmount = Number(group.amount) || 0;
                    const memberCount = group.members.length;
                    const share = memberCount ? totalAmount / memberCount : 0;
                    const isCreator = group.creatorEmail === currentUserEmail;
                    const subtitle = isCreator
                        ? `You will receive ₹${(totalAmount - share).toFixed(2)} from ${memberCount - 1} member(s)`
                        : `You owe ₹${share.toFixed(2)} to ${getStoredUser(group.creatorEmail)?.name || 'group creator'}`;
                    const actionButtons = isCreator
                        ? `<div class="group-actions">
                                <button class="btn-edit-group" data-group-id="${group.id}">Edit</button>
                                <button class="btn-delete-group" data-group-id="${group.id}">Delete</button>
                           </div>`
                        : '';
                    return `
            <div class="expense-item">
                <div class="expense-details">
                    <div class="expense-info">
                        <h4>${group.name}</h4>
                        <p>${subtitle}</p>
                    </div>
                </div>
                <div class="expense-amount-section">
                    <div class="expense-amount">₹${totalAmount.toFixed(2)}</div>
                    ${actionButtons}
                </div>
            </div>
        `;
                })
                .join('');
            document.querySelectorAll('.btn-edit-group').forEach((button) => {
                button.addEventListener('click', () => {
                    showEditGroupModal(button.dataset.groupId);
                });
            });
            document.querySelectorAll('.btn-delete-group').forEach((button) => {
                button.addEventListener('click', () => {
                    deleteGroup(button.dataset.groupId);
                });
            });
        }
    }

    const youOwe = document.getElementById('youOwe');
    const youAreOwed = document.getElementById('youAreOwed');

    if (youOwe) youOwe.textContent = `₹${(currentUser?.pay || 0).toFixed(2)}`;
    if (youAreOwed) youAreOwed.textContent = `₹${(currentUser?.receive || 0).toFixed(2)}`;
}

function showCreateGroupModal() {
    const users = getStoredUsers();
    const currentUserEmail = localStorage.getItem('splitwiseLoggedInUser');
    let modalHTML = `
        <div class="modal" id="createGroupModal">
            <div class="modal-content">
                <button class="close-modal" id="closeModal">&times;</button>
                <h3>Create New Group</h3>
                <form id="createGroupForm">
                    <div class="form-group">
                        <label for="groupName">Group Name</label>
                        <input type="text" id="groupName" placeholder="Enter group name" required>
                    </div>
                    <div class="form-group">
                        <label for="groupAmount">Amount</label>
                        <input type="number" id="groupAmount" placeholder="Enter amount" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Select Members (You are included automatically)</label>
                        <div class="users-list">
    `;
    users.forEach(user => {
        const isCurrentUser = user.email === currentUserEmail;
        const checked = isCurrentUser ? 'checked disabled' : '';
        modalHTML += `
            <div class="user-item">
                <input type="checkbox" id="user_${user.email}" value="${user.email}" ${checked}>
                <label for="user_${user.email}">${user.name}${isCurrentUser ? ' (You)' : ''}</label>
            </div>
        `;
    });
    modalHTML += `
                        </div>
                    </div>
                    <button type="submit" class="btn-submit">Create Group</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);



    const modal = document.getElementById('createGroupModal');
    const closeBtn = document.getElementById('closeModal');
    const form = document.getElementById('createGroupForm');

    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const groupName = document.getElementById('groupName').value.trim();
        const groupAmount = parseFloat(document.getElementById('groupAmount').value);
        const selectedUsers = Array.from(document.querySelectorAll('#createGroupModal input[type="checkbox"]:checked')).map(cb => cb.value);

        if (groupName && groupAmount > 0 && selectedUsers.length > 0) {
            const groups = getStoredGroups();
            const newGroup = {
                id: generateId(),
                name: groupName,
                amount: groupAmount,
                members: selectedUsers,
                creatorEmail: currentUserEmail,
                createdAt: new Date().toISOString()
            };
            groups.push(newGroup);
            saveStoredGroups(groups);
            updateUserBalancesFromGroups();
            modal.remove();
            initializeDashboard();
            toast({
                message: 'Group created successfully',
                type: 'success',
                duration: 3000,
                position: 'top-right'
            });
        } else {
            toast({
                message: 'Please fill all fields and select at least one member',
                type: 'error',
                duration: 3000,
                position: 'top-right'
            });
        }
    });
}

function deleteGroup(groupId) {
    const groups = getStoredGroups();
    const groupIndex = groups.findIndex((group) => group.id === groupId);
    if (groupIndex === -1) {
        toast({
            message: 'Group not found',
            type: 'error',
            duration: 3000,
            position: 'top-right'
        });
        return;
    }
    const currentUserEmail = localStorage.getItem('splitwiseLoggedInUser');
    if (groups[groupIndex].creatorEmail !== currentUserEmail) {
        toast({
            message: 'You do not have permission to delete this group',
            type: 'error',
            duration: 3000,
            position: 'top-right'
        });
        return;
    }
    groups.splice(groupIndex, 1);
    saveStoredGroups(groups);
    updateUserBalancesFromGroups();
    initializeDashboard();
    toast({
        message: 'Group deleted successfully',
        type: 'success',
        duration: 3000,
        position: 'top-right'
    });
}

function showEditGroupModal(groupId) {
    const groups = getStoredGroups();
    const groupIndex = groups.findIndex((group) => group.id === groupId);
    const group = groups[groupIndex];
    const users = getStoredUsers();
    const currentUserEmail = localStorage.getItem('splitwiseLoggedInUser');

    if (!group || group.creatorEmail !== currentUserEmail) {
        toast({
            message: 'You do not have permission to edit this group',
            type: 'error',
            duration: 3000,
            position: 'top-right'
        });
        return;
    }

    let modalHTML = `
        <div class="modal" id="editGroupModal">
            <div class="modal-content">
                <button class="close-modal" id="closeEditModal">&times;</button>
                <h3>Edit Group</h3>
                <form id="editGroupForm">
                    <div class="form-group">
                        <label for="editGroupName">Group Name</label>
                        <input type="text" id="editGroupName" placeholder="Enter group name" value="${group.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="editGroupAmount">Amount</label>
                        <input type="number" id="editGroupAmount" placeholder="Enter amount" step="0.01" value="${group.amount}" required>
                    </div>
                    <div class="form-group">
                        <label>Select Members (You are always included)</label>
                        <div class="users-list">
    `;
    users.forEach(user => {
        const isCurrentUser = user.email === currentUserEmail;
        const isSelected = group.members.includes(user.email);
        const checked = isCurrentUser || isSelected ? 'checked' : '';
        const disabled = isCurrentUser ? 'disabled' : '';
        modalHTML += `
            <div class="user-item">
                <input type="checkbox" id="edit_user_${user.email}" value="${user.email}" ${checked} ${disabled}>
                <label for="edit_user_${user.email}">${user.name}${isCurrentUser ? ' (You)' : ''}</label>
            </div>
        `;
    });
    modalHTML += `
                        </div>
                    </div>
                    <button type="submit" class="btn-submit">Save Changes</button>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('editGroupModal');
    const closeBtn = document.getElementById('closeEditModal');
    const form = document.getElementById('editGroupForm');

    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const groupName = document.getElementById('editGroupName').value.trim();
        const groupAmount = parseFloat(document.getElementById('editGroupAmount').value);
        const selectedUsers = Array.from(document.querySelectorAll('#editGroupModal input[type="checkbox"]:checked')).map(cb => cb.value);

        if (groupName && groupAmount > 0 && selectedUsers.length > 0) {
            groups[groupIndex] = {
                ...group,
                name: groupName,
                amount: groupAmount,
                members: selectedUsers
            };
            saveStoredGroups(groups);
            updateUserBalancesFromGroups();
            modal.remove();
            initializeDashboard();
            toast({
                message: 'Group updated successfully',
                type: 'success',
                duration: 3000,
                position: 'top-right'
            });
        } else {
            toast({
                message: 'Please fill all fields and select at least one member',
                type: 'error',
                duration: 3000,
                position: 'top-right'
            });
        }
    });
}


if (document.querySelector('.dashboard-container')) {
    initializeDashboard();
}


// Forgot Password
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
            if (resetError) {
                resetError.textContent = errorMessage;
                resetError.style.color = '#ffbaba';
            }
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

