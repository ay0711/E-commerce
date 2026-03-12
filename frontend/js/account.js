function requireAuth() {
    const user = getCurrentUser();
    if (!user || !user._id) {
        showAlert('Please login to view your orders.', 'info');
        setTimeout(() => {
            window.location.href = 'login.html?next=account.html';
        }, 700);
        return null;
    }
    return user;
}

function orderStatusClass(status) {
    const val = String(status || '').toLowerCase();
    if (val === 'delivered') return 'status-success';
    if (val === 'cancelled') return 'status-danger';
    return 'status-warning';
}

async function loadOrders() {
    const user = requireAuth();
    if (!user) return;

    const container = document.getElementById('ordersList');
    try {
        const response = await fetch(`${API_ENDPOINTS.orders}/user/${user._id}`);
        const orders = await response.json();

        if (!response.ok) {
            throw new Error(orders.message || 'Unable to load orders');
        }

        if (!orders.length) {
            container.innerHTML = '<div class="empty-message">No orders yet. Start shopping to place your first order.</div>';
            return;
        }

        container.innerHTML = orders.map((order) => `
            <article class="order-card card-enter">
                <div class="order-head">
                    <p><strong>Order ID:</strong> ${order._id}</p>
                    <span class="status-pill ${orderStatusClass(order.status)}">${order.status || 'pending'}</span>
                </div>
                <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                <p><strong>Total:</strong> $${Number(order.totalPrice || 0).toFixed(2)}</p>
                <p><strong>Items:</strong> ${order.orderItems?.length || 0}</p>
                <a class="btn btn-primary" href="order-details.html?id=${order._id}">View Details</a>
            </article>
        `).join('');
    } catch (error) {
        container.innerHTML = '<div class="empty-message">Unable to load your orders right now.</div>';
    }
}

document.addEventListener('DOMContentLoaded', loadOrders);
