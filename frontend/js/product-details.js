// Product details page functionality

function getProductIdFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function createStars(rating) {
    const safeRating = Math.round(Number(rating || 0));
    return `${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}`;
}

function renderProductDetails(product) {
    const container = document.getElementById('productDetailsContent');
    if (!container) return;

    container.innerHTML = `
        <div>
            <img src="${product.image}" alt="${product.name}" class="product-details-image">
        </div>
        <div class="product-details-info">
            <div class="product-category">${product.category || 'General'}</div>
            <h1>${product.name}</h1>
            <div class="product-rating">
                <span class="stars">${createStars(product.ratings)}</span>
                <span>(${Number(product.numReviews || 0)} reviews)</span>
            </div>
            <div class="product-price">$${Number(product.price || 0).toFixed(2)}</div>
            <p class="product-description">${product.description || ''}</p>
            <div class="product-stock ${Number(product.stock || 0) > 0 ? 'in-stock' : 'out-of-stock'}">
                ${Number(product.stock || 0) > 0 ? `In Stock (${Number(product.stock || 0)})` : 'Out of Stock'}
            </div>

            <div class="quantity-selector">
                <button type="button" id="decreaseQty">-</button>
                <input type="number" id="quantityInput" value="1" min="1" max="${Math.max(Number(product.stock || 1), 1)}">
                <button type="button" id="increaseQty">+</button>
            </div>

            <button class="btn btn-primary btn-block" id="addToCartBtn" ${Number(product.stock || 0) <= 0 ? 'disabled' : ''}>
                Add to Cart
            </button>
        </div>
    `;

    const qtyInput = document.getElementById('quantityInput');
    const decBtn = document.getElementById('decreaseQty');
    const incBtn = document.getElementById('increaseQty');
    const addBtn = document.getElementById('addToCartBtn');

    if (decBtn && qtyInput) {
        decBtn.addEventListener('click', () => {
            const next = Math.max(1, Number(qtyInput.value || 1) - 1);
            qtyInput.value = String(next);
        });
    }

    if (incBtn && qtyInput) {
        incBtn.addEventListener('click', () => {
            const cap = Math.max(Number(product.stock || 1), 1);
            const next = Math.min(cap, Number(qtyInput.value || 1) + 1);
            qtyInput.value = String(next);
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const qty = Math.max(1, Number(qtyInput.value || 1));
            await addToCart(product._id, qty);
        });
    }
}

async function loadProductDetails() {
    const productId = getProductIdFromQuery();
    const container = document.getElementById('productDetailsContent');

    if (!productId) {
        if (container) container.innerHTML = '<div class="empty-message">Invalid product link.</div>';
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINTS.products}/${productId}`);
        if (!response.ok) {
            throw new Error('Product not found');
        }

        const product = await response.json();
        renderProductDetails(product);
    } catch (error) {
        if (container) {
            container.innerHTML = '<div class="empty-message">Unable to load this product.</div>';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProductDetails();
});
