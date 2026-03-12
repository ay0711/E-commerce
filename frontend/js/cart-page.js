// Cart page functionality

function safeImage(url) {
    return url || 'fallback-product.svg';
}

async function getGuestCartItems() {
    const localCart = getLocalCart();
    if (!localCart.length) return [];

    const missingProductIds = [];

    const items = await Promise.all(
        localCart.map(async (item) => {
            try {
                const response = await fetch(`${API_ENDPOINTS.products}/${item.productId}`);
                if (!response.ok) {
                    // Product was removed from catalog; mark stale guest-cart entry for cleanup.
                    missingProductIds.push(item.productId);
                    return null;
                }

                const product = await response.json();
                return {
                    product,
                    quantity: item.quantity,
                };
            } catch (error) {
                missingProductIds.push(item.productId);
                return null;
            }
        })
    );

    if (missingProductIds.length > 0) {
        const cleanedCart = localCart.filter(item => !missingProductIds.includes(item.productId));
        saveLocalCart(cleanedCart);
        await updateCartCount();
    }

    return items.filter(Boolean);
}

function calculateTotals(items) {
    const subtotal = items.reduce((sum, item) => sum + Number(item.product.price || 0) * Number(item.quantity || 0), 0);
    const tax = subtotal * 0.15;
    const shipping = subtotal > 100 ? 0 : (subtotal > 0 ? 10 : 0);
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total };
}

function updateSummary(items) {
    const { subtotal, tax, shipping, total } = calculateTotals(items);

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.disabled = items.length === 0;
    }
}

function renderCartItems(items) {
    const cartItemsContainer = document.getElementById('cartItems');
    if (!cartItemsContainer) return;

    if (!items.length) {
        cartItemsContainer.innerHTML = '<div class="empty-message">Your cart is empty</div>';
        updateSummary([]);
        return;
    }

    cartItemsContainer.innerHTML = items.map((item) => {
        const product = item.product;
        return `
            <div class="cart-item card-enter" data-product-id="${product._id}">
                <img src="${safeImage(product.image)}" alt="${product.name}" class="cart-item-image" loading="lazy" decoding="async" sizes="(max-width: 768px) 100vw, 120px" onerror="this.onerror=null;this.src='fallback-product.svg';">
                <div class="cart-item-info">
                    <h3>${product.name}</h3>
                    <p class="cart-item-price">$${Number(product.price || 0).toFixed(2)}</p>
                    <div class="cart-item-actions">
                        <button class="btn btn-primary" onclick="changeQuantity('${product._id}', -1)">-</button>
                        <span>Qty: ${item.quantity}</span>
                        <button class="btn btn-primary" onclick="changeQuantity('${product._id}', 1)">+</button>
                        <button class="btn btn-danger" onclick="removeFromCartPage('${product._id}')">Remove</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    updateSummary(items);
}

async function getCartItems() {
    const user = getCurrentUser();

    if (!user) {
        return getGuestCartItems();
    }

    try {
        const response = await fetch(`${API_ENDPOINTS.cart}/${user._id}`);
        if (!response.ok) {
            return [];
        }

        const cart = await response.json();
        return (cart.items || []).filter(item => item.product).map(item => ({
            product: item.product,
            quantity: item.quantity,
        }));
    } catch (error) {
        return [];
    }
}

async function loadCartPage() {
    const items = await getCartItems();
    renderCartItems(items);
}

async function changeQuantity(productId, delta) {
    const user = getCurrentUser();

    if (!user) {
        const cart = getLocalCart();
        const idx = cart.findIndex(item => item.productId === productId);

        if (idx === -1) return;

        cart[idx].quantity += delta;
        if (cart[idx].quantity <= 0) {
            cart.splice(idx, 1);
        }

        saveLocalCart(cart);
        await updateCartCount();
        await loadCartPage();
        return;
    }

    try {
        const currentItems = await getCartItems();
        const targetItem = currentItems.find(item => item.product._id === productId);
        if (!targetItem) return;

        const newQty = targetItem.quantity + delta;

        if (newQty <= 0) {
            await fetch(`${API_ENDPOINTS.cart}/${user._id}/items/${productId}`, {
                method: 'DELETE'
            });
        } else {
            await fetch(`${API_ENDPOINTS.cart}/${user._id}/items/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: newQty }),
            });
        }

        await updateCartCount();
        await loadCartPage();
    } catch (error) {
        showAlert('Unable to update cart item.', 'error');
    }
}

async function removeFromCartPage(productId) {
    const user = getCurrentUser();

    if (!user) {
        const cart = getLocalCart().filter(item => item.productId !== productId);
        saveLocalCart(cart);
        await updateCartCount();
        await loadCartPage();
        return;
    }

    try {
        await fetch(`${API_ENDPOINTS.cart}/${user._id}/items/${productId}`, {
            method: 'DELETE',
        });

        await updateCartCount();
        await loadCartPage();
    } catch (error) {
        showAlert('Unable to remove item.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const user = getCurrentUser();
            if (!user) {
                showAlert('Please login to continue to checkout.', 'info');
                setTimeout(() => {
                    window.location.href = 'login.html?next=checkout.html';
                }, 600);
                return;
            }

            window.location.href = 'checkout.html';
        });
    }

    loadCartPage();
});
