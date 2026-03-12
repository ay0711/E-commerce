// Cart utilities

// Get cart from localStorage
function getLocalCart() {
    const cartStr = localStorage.getItem('cart');
    return cartStr ? JSON.parse(cartStr) : [];
}

// Save cart to localStorage
function saveLocalCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Add item to cart
async function addToCart(productId, quantity = 1) {
    const user = getCurrentUser();
    
    if (!user) {
        // Save to localStorage if not logged in
        const cart = getLocalCart();
        const existingItem = cart.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ productId, quantity });
        }
        
        saveLocalCart(cart);
        updateCartCount();
        showAlert('Added to cart!', 'success');
        return;
    }
    
    try {
        const response = await fetch(`${API_ENDPOINTS.cart}/${user._id}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId, quantity })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            updateCartCount();
            showAlert('Added to cart!', 'success');
        } else {
            showAlert(data.message || 'Failed to add to cart', 'error');
        }
    } catch (error) {
        showAlert('Network error. Please try again.', 'error');
    }
}

// Update cart count in navbar
async function updateCartCount() {
    const cartCountElement = document.getElementById('cartCount');
    if (!cartCountElement) return;
    
    const user = getCurrentUser();
    
    if (!user) {
        const cart = getLocalCart();
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = count;
        return;
    }
    
    try {
        const response = await fetch(`${API_ENDPOINTS.cart}/${user._id}`);
        const data = await response.json();
        
        if (response.ok) {
            const count = data.items.reduce((total, item) => total + item.quantity, 0);
            cartCountElement.textContent = count;
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});
