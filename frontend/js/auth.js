// Authentication utilities

// Get current user from localStorage
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Save user to localStorage
function saveUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// Remove user from localStorage
function removeUser() {
    localStorage.removeItem('user');
}

// Update user info display
function updateUserInfo() {
    const userInfoElement = document.getElementById('userInfo');
    if (!userInfoElement) return;

    const user = getCurrentUser();
    
    if (user) {
        userInfoElement.innerHTML = `
            <span>Welcome, ${user.name}</span>
            <a href="account.html">My Orders</a>
            <a href="profile.html">Profile</a>
            <a href="#" id="logoutBtn">Logout</a>
        `;
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                removeUser();
                window.location.href = 'index.html';
            });
        }
    } else {
        userInfoElement.innerHTML = `
            <a href="login.html">Login</a>
            <a href="register.html">Register</a>
        `;
    }
}

// Modal utilities
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateUserInfo();
});

// Show alert message
function showAlert(message, type = 'info') {
    const body = document.body;
    let toastContainer = document.getElementById('toastContainer');

    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 220);
    }, 3200);
}
