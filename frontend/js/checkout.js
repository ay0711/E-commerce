// Checkout page functionality

async function getCheckoutItems() {
    const user = getCurrentUser();

    if (!user || !user._id) {
        return [];
    }

    try {
        const response = await fetch(`${API_ENDPOINTS.cart}/${user._id}`);
        if (!response.ok) return [];

        const cart = await response.json();
        return (cart.items || []).filter(item => item.product).map(item => ({
            product: item.product,
            quantity: item.quantity,
        }));
    } catch (error) {
        return [];
    }
}

function getTotals(items) {
    const subtotal = items.reduce((sum, item) => sum + Number(item.product.price || 0) * Number(item.quantity || 0), 0);
    const tax = subtotal * 0.15;
    const shipping = subtotal > 100 ? 0 : (subtotal > 0 ? 10 : 0);
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total };
}

function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    let errorNode = field.parentElement.querySelector('.field-error');
    if (!errorNode) {
        errorNode = document.createElement('small');
        errorNode.className = 'field-error';
        field.parentElement.appendChild(errorNode);
    }

    errorNode.textContent = message || '';
    field.classList.toggle('input-error', Boolean(message));
}

function validateCheckoutFields() {
    const values = {
        street: document.getElementById('street').value.trim(),
        city: document.getElementById('city').value.trim(),
        state: document.getElementById('state').value.trim(),
        zipCode: document.getElementById('zipCode').value.trim(),
        country: document.getElementById('country').value.trim(),
    };

    const checks = [
        ['street', values.street.length < 5 ? 'Street address should be at least 5 characters.' : ''],
        ['city', !/^[A-Za-z\s.'-]{2,}$/.test(values.city) ? 'Enter a valid city name.' : ''],
        ['state', !/^[A-Za-z\s.'-]{2,}$/.test(values.state) ? 'Enter a valid state/region.' : ''],
        ['zipCode', !/^[A-Za-z0-9\-\s]{3,10}$/.test(values.zipCode) ? 'Zip code format is invalid.' : ''],
        ['country', !/^[A-Za-z\s.'-]{2,}$/.test(values.country) ? 'Enter a valid country.' : ''],
    ];

    checks.forEach(([id, msg]) => setFieldError(id, msg));
    return !checks.some(([, msg]) => msg);
}

async function loadSavedAddress(userId) {
    try {
        const response = await fetch(`${API_ENDPOINTS.users}/profile/${userId}`);
        const profile = await response.json();
        if (!response.ok) return;

        const address = profile.address || {};
        document.getElementById('street').value = address.street || '';
        document.getElementById('city').value = address.city || '';
        document.getElementById('state').value = address.state || '';
        document.getElementById('zipCode').value = address.zipCode || '';
        document.getElementById('country').value = address.country || '';
    } catch (error) {
        // Silent fail: checkout still works even if profile prefill is unavailable.
    }
}

async function saveAddressToProfile(userId, shippingAddress) {
    try {
        await fetch(`${API_ENDPOINTS.users}/profile/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: shippingAddress }),
        });
    } catch (error) {
        // Non-blocking update.
    }
}

function renderCheckoutSummary(items) {
    const orderItems = document.getElementById('orderItems');
    if (!orderItems) return;

    if (!items.length) {
        orderItems.innerHTML = '<div class="empty-message">Your cart is empty</div>';
    } else {
        orderItems.innerHTML = items.map(item => `
            <div class="order-item">
                <img src="${item.product.image}" alt="${item.product.name}" class="order-item-image">
                <div class="order-item-info">
                    <div class="order-item-name">${item.product.name}</div>
                    <div class="order-item-quantity">Qty: ${item.quantity}</div>
                </div>
                <div class="order-item-price">$${(Number(item.product.price || 0) * Number(item.quantity || 0)).toFixed(2)}</div>
            </div>
        `).join('');
    }

    const totals = getTotals(items);
    document.getElementById('subtotal').textContent = `$${totals.subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${totals.tax.toFixed(2)}`;
    document.getElementById('shipping').textContent = `$${totals.shipping.toFixed(2)}`;
    document.getElementById('total').textContent = `$${totals.total.toFixed(2)}`;
}

async function clearUserCart(userId) {
    await fetch(`${API_ENDPOINTS.cart}/${userId}`, { method: 'DELETE' });
    await updateCartCount();
}

async function submitOrder(e) {
    e.preventDefault();

    const user = getCurrentUser();
    if (!user || !user._id) {
        showAlert('Please login to place an order.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html?next=checkout.html';
        }, 700);
        return;
    }

    const items = await getCheckoutItems();

    if (!items.length) {
        showAlert('Your cart is empty.', 'error');
        return;
    }

    if (!validateCheckoutFields()) {
        showAlert('Please fix the highlighted fields before placing your order.', 'error');
        return;
    }

    const shippingAddress = {
        street: document.getElementById('street').value.trim(),
        city: document.getElementById('city').value.trim(),
        state: document.getElementById('state').value.trim(),
        zipCode: document.getElementById('zipCode').value.trim(),
        country: document.getElementById('country').value.trim(),
    };

    const paymentMethod = document.getElementById('paymentMethod').value;

    try {
        const response = await fetch(API_ENDPOINTS.orders, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user._id,
                shippingAddress,
                paymentMethod,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            showAlert(data.message || 'Unable to place order.', 'error');
            return;
        }

        await saveAddressToProfile(user._id, shippingAddress);

        await clearUserCart(user._id);
        showAlert('Order placed successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1200);
    } catch (error) {
        showAlert('Network error while placing order.', 'error');
    }
}

async function initCheckoutPage() {
    const user = getCurrentUser();
    if (!user || !user._id) {
        showAlert('Please login to access checkout.', 'info');
        setTimeout(() => {
            window.location.href = 'login.html?next=checkout.html';
        }, 700);
        return;
    }

    await loadSavedAddress(user._id);

    const items = await getCheckoutItems();
    renderCheckoutSummary(items);

    const form = document.getElementById('checkoutForm');
    if (form) {
        form.addEventListener('submit', submitOrder);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initCheckoutPage();
});
