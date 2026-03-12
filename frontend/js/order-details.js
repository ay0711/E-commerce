function getOrderId() {
    return new URLSearchParams(window.location.search).get('id');
}

function requireAuthForOrderDetails() {
    const user = getCurrentUser();
    if (!user || !user._id) {
        showAlert('Please login to view order details.', 'info');
        setTimeout(() => {
            window.location.href = 'login.html?next=account.html';
        }, 700);
        return null;
    }
    return user;
}

function renderTracking(order) {
    const status = String(order.status || 'pending').toLowerCase();
    const statuses = ['pending', 'processing', 'shipped', 'delivered'];

    return statuses.map((step) => {
        const done = statuses.indexOf(step) <= statuses.indexOf(status);
        return `<span class="track-step ${done ? 'done' : ''}">${step}</span>`;
    }).join('');
}

function safeImage(url) {
    return url || 'fallback-product.svg';
}

async function loadOrderDetails() {
    const user = requireAuthForOrderDetails();
    if (!user) return;

    const orderId = getOrderId();
    const container = document.getElementById('orderDetails');

    if (!orderId) {
        container.innerHTML = '<div class="empty-message">Invalid order link.</div>';
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINTS.orders}/${orderId}`);
        const order = await response.json();

        if (!response.ok) {
            throw new Error(order.message || 'Order not found');
        }

        if (order.user?._id && order.user._id !== user._id) {
            container.innerHTML = '<div class="empty-message">You are not allowed to view this order.</div>';
            return;
        }

        const shipping = order.shippingAddress || {};
        container.innerHTML = `
            <div class="order-detail-wrap">
                <div class="track-row">${renderTracking(order)}</div>
                <p><strong>Order ID:</strong> ${order._id}</p>
                <p><strong>Status:</strong> ${order.status || 'pending'}</p>
                <p><strong>Placed:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                <p><strong>Payment:</strong> ${order.paymentMethod || 'N/A'}</p>
                <p><strong>Shipping Address:</strong> ${shipping.street || ''}, ${shipping.city || ''}, ${shipping.state || ''}, ${shipping.zipCode || ''}, ${shipping.country || ''}</p>
                <div class="order-line-items">
                    ${(order.orderItems || []).map((item) => `
                        <div class="order-item">
                            <img class="order-item-image" src="${safeImage(item.image)}" alt="${item.name}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='fallback-product.svg';">
                            <div class="order-item-info">
                                <div class="order-item-name">${item.name}</div>
                                <div class="order-item-quantity">Qty: ${item.quantity}</div>
                            </div>
                            <div class="order-item-price">$${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
                <p><strong>Total:</strong> $${Number(order.totalPrice || 0).toFixed(2)}</p>
            </div>
        `;
    } catch (error) {
        container.innerHTML = '<div class="empty-message">Unable to load order details.</div>';
    }
}

document.addEventListener('DOMContentLoaded', loadOrderDetails);
