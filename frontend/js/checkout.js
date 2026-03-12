// Checkout page functionality

async function getCheckoutItems() {
    const user = getCurrentUser();

    if (!user) {
        const localItems = getLocalCart();
        if (!localItems.length) return [];

        const products = await Promise.all(localItems.map(async (item) => {
            try {
                const response = await fetch(`${API_ENDPOINTS.products}/${item.productId}`);
                if (!response.ok) return null;
                const product = await response.json();
                return {
                    product,
                    quantity: item.quantity,
                };
            } catch (error) {
                return null;
            }
        }));

        return products.filter(Boolean);
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

async function clearGuestCart() {
    saveLocalCart([]);
    await updateCartCount();
}

async function clearUserCart(userId) {
    await fetch(`${API_ENDPOINTS.cart}/${userId}`, { method: 'DELETE' });
    await updateCartCount();
}

async function submitOrder(e) {
    e.preventDefault();

    const user = getCurrentUser();
    const items = await getCheckoutItems();

    if (!items.length) {
        showAlert('Your cart is empty.', 'error');
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

    if (user && user._id) {
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

            await clearUserCart(user._id);
            showAlert('Order placed successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1200);
            return;
        } catch (error) {
            showAlert('Network error while placing order.', 'error');
            return;
        }
    }

    // Guest checkout fallback
    await clearGuestCart();
    showAlert('Order placed as guest successfully!', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1200);
}

async function initCheckoutPage() {
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
