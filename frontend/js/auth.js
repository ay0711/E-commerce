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

    setupMobileDrawer();
}

function setupSkipLink() {
    if (document.querySelector('.skip-link')) return;

    const mainTarget = document.querySelector('main, .hero, .cart-section, .checkout-section, .auth-section, .account-section, .product-details');
    if (mainTarget && !mainTarget.id) {
        mainTarget.id = 'mainContent';
    }

    const skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#mainContent';
    skip.textContent = 'Skip to content';
    document.body.insertBefore(skip, document.body.firstChild);
}

function setupMobileDrawer() {
    const navbar = document.querySelector('.navbar .container');
    if (!navbar) return;

    const navMenu = navbar.querySelector('.nav-menu');
    const navActions = navbar.querySelector('.nav-actions');
    if (!navMenu || !navActions) return;

    let toggleBtn = navbar.querySelector('.nav-toggle');
    let drawer = document.getElementById('mobileDrawer');
    let backdrop = document.getElementById('mobileBackdrop');

    if (!toggleBtn) {
        toggleBtn = document.createElement('button');
        toggleBtn.className = 'nav-toggle';
        toggleBtn.type = 'button';
        toggleBtn.setAttribute('aria-label', 'Open navigation menu');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = '<span></span><span></span><span></span>';
        navbar.insertBefore(toggleBtn, navActions);
    }

    if (!drawer) {
        drawer = document.createElement('aside');
        drawer.id = 'mobileDrawer';
        drawer.className = 'mobile-drawer';
        drawer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(drawer);
    }

    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'mobileBackdrop';
        backdrop.className = 'mobile-backdrop';
        document.body.appendChild(backdrop);
    }

    const navLinks = [...navMenu.querySelectorAll('a')]
        .concat([...navActions.querySelectorAll('a')])
        .map(link => `<a href="${link.getAttribute('href') || '#'}">${link.textContent.trim()}</a>`)
        .join('');

    drawer.innerHTML = `
        <div class="drawer-head">
            <strong>ShopHub</strong>
            <button type="button" class="drawer-close" aria-label="Close navigation menu">Close</button>
        </div>
        <nav class="drawer-links">${navLinks}</nav>
    `;

    const openDrawer = () => {
        drawer.classList.add('open');
        backdrop.classList.add('show');
        drawer.setAttribute('aria-hidden', 'false');
        toggleBtn.setAttribute('aria-expanded', 'true');
    };

    const closeDrawer = () => {
        drawer.classList.remove('open');
        backdrop.classList.remove('show');
        drawer.setAttribute('aria-hidden', 'true');
        toggleBtn.setAttribute('aria-expanded', 'false');
    };

    toggleBtn.onclick = openDrawer;
    backdrop.onclick = closeDrawer;

    const closeBtn = drawer.querySelector('.drawer-close');
    if (closeBtn) {
        closeBtn.onclick = closeDrawer;
    }

    drawer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeDrawer);
    });

    document.onkeydown = (e) => {
        if (e.key === 'Escape') {
            closeDrawer();
        }
    };
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
    setupSkipLink();
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
