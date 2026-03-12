// Products page functionality

let allProducts = [];
let visibleProducts = [];
let currentCategory = '';
let searchQuery = '';
let currentSort = 'relevance';

const PRODUCTS_PAGE_SIZE = 24;
let visibleCount = PRODUCTS_PAGE_SIZE;

const WISHLIST_KEY = 'wishlistProductIds';

function getWishlist() {
    try {
        const raw = localStorage.getItem(WISHLIST_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        return [];
    }
}

function setWishlist(ids) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
}

function isWishlisted(productId) {
    return getWishlist().includes(productId);
}

function toggleWishlist(productId) {
    const ids = getWishlist();
    const exists = ids.includes(productId);
    const next = exists ? ids.filter(id => id !== productId) : [...ids, productId];
    setWishlist(next);
    applyClientTransformations();
    showAlert(exists ? 'Removed from wishlist' : 'Added to wishlist', 'info');
}

function findProductById(productId) {
    return allProducts.find(p => p._id === productId);
}

function ensureQuickViewModal() {
    if (document.getElementById('quickViewModal')) return;

    const modal = document.createElement('div');
    modal.id = 'quickViewModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content quick-view-content" role="dialog" aria-modal="true" aria-label="Quick view product">
            <button type="button" class="close" id="quickViewClose" aria-label="Close quick view">&times;</button>
            <div id="quickViewBody"></div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    const closeBtn = document.getElementById('quickViewClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
}

function openQuickView(productId) {
    const product = findProductById(productId);
    if (!product) return;

    ensureQuickViewModal();
    const modal = document.getElementById('quickViewModal');
    const body = document.getElementById('quickViewBody');
    if (!modal || !body) return;

    body.innerHTML = `
        <div class="quick-view-grid">
            <img class="quick-view-image" src="${safeImage(product.image)}" alt="${product.name}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='fallback-product.svg';">
            <div>
                <p class="product-category">${product.category || 'General'}</p>
                <h3>${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <p class="product-price">$${Number(product.price || 0).toFixed(2)}</p>
                <div class="product-stock ${Number(product.stock || 0) > 0 ? 'in-stock' : 'out-of-stock'}">
                    ${Number(product.stock || 0) > 0 ? `In Stock (${Number(product.stock || 0)})` : 'Out of Stock'}
                </div>
                <div class="quick-view-actions">
                    <button class="btn btn-primary" onclick="addToCart('${product._id}')">Add to Cart</button>
                    <button class="btn btn-success" onclick="viewProduct('${product._id}')">View Full Details</button>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

function safeImage(url) {
    return url || 'fallback-product.svg';
}

function productSkeletonMarkup() {
    return Array.from({ length: 8 }).map(() => `
        <div class="product-card skeleton-card">
            <div class="skeleton-box skeleton-img"></div>
            <div class="product-info">
                <div class="skeleton-line w-30"></div>
                <div class="skeleton-line w-80"></div>
                <div class="skeleton-line w-60"></div>
                <div class="skeleton-line w-40"></div>
            </div>
        </div>
    `).join('');
}

// Fetch and display products
async function fetchProducts() {
    try {
        const productsGrid = document.getElementById('productsGrid');
        productsGrid.innerHTML = productSkeletonMarkup();
        
        let url = API_ENDPOINTS.products;
        const params = new URLSearchParams();
        
        if (currentCategory) {
            params.append('category', currentCategory);
        }
        
        if (searchQuery) {
            params.append('search', searchQuery);
        }
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const products = await response.json();
        
        allProducts = products;
        visibleCount = PRODUCTS_PAGE_SIZE;
        applyClientTransformations();
    } catch (error) {
        const productsGrid = document.getElementById('productsGrid');
        productsGrid.innerHTML = '<div class="empty-message">Error loading products. Please try again.</div>';
        updateResultCount(0);
        toggleLoadMore(false);
    }
}

function sortProducts(products) {
    const sorted = [...products];

    switch (currentSort) {
        case 'price-asc':
            return sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        case 'price-desc':
            return sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        case 'rating-desc':
            return sorted.sort((a, b) => Number(b.ratings || 0) - Number(a.ratings || 0));
        case 'name-asc':
            return sorted.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        default:
            return sorted;
    }
}

function applyClientTransformations() {
    const transformed = sortProducts(allProducts);
    visibleProducts = transformed.slice(0, visibleCount);
    displayProducts(visibleProducts);
    updateResultCount(transformed.length);
    toggleLoadMore(transformed.length > visibleCount);
}

function updateResultCount(total) {
    const resultCount = document.getElementById('resultCount');
    if (!resultCount) return;

    if (total === 0) {
        resultCount.textContent = 'No products found for this filter.';
        return;
    }

    const showing = Math.min(visibleCount, total);
    resultCount.textContent = `Showing ${showing} of ${total} products`;
}

function toggleLoadMore(show) {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) return;

    loadMoreBtn.style.display = show ? 'inline-flex' : 'none';
}

// Display products in grid
function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    
    if (products.length === 0) {
        productsGrid.innerHTML = '<div class="empty-message">No products found</div>';
        return;
    }
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card card-enter" onclick="viewProduct('${product._id}')">
            <img src="${safeImage(product.image)}" alt="${product.name}" class="product-image" loading="lazy" decoding="async" sizes="(max-width: 768px) 50vw, 25vw" onerror="this.onerror=null;this.src='fallback-product.svg';">
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3>${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">$${Number(product.price || 0).toFixed(2)}</div>
                <div class="product-rating">
                    <span class="stars">${'★'.repeat(Math.round(product.ratings || 0))}${'☆'.repeat(5 - Math.round(product.ratings || 0))}</span>
                    <span>(${Number(product.numReviews || 0)} reviews)</span>
                </div>
                <div class="product-stock ${Number(product.stock || 0) > 0 ? 'in-stock' : 'out-of-stock'}">
                    ${Number(product.stock || 0) > 0 ? `In Stock (${Number(product.stock || 0)})` : 'Out of Stock'}
                </div>
                <div class="product-card-actions" onclick="event.stopPropagation();">
                    <button class="btn btn-primary btn-block" onclick="addToCart('${product._id}')">
                        Add to Cart
                    </button>
                    <button class="btn btn-success btn-block" onclick="openQuickView('${product._id}')" aria-label="Quick view ${product.name}">
                        Quick View
                    </button>
                    <button class="wishlist-btn ${isWishlisted(product._id) ? 'active' : ''}" onclick="toggleWishlist('${product._id}')" aria-label="Toggle wishlist for ${product.name}">
                        ${isWishlisted(product._id) ? '♥ Saved' : '♡ Save'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// View product details
function viewProduct(productId) {
    window.location.href = `product-details.html?id=${productId}`;
}

// Category filter
document.addEventListener('DOMContentLoaded', () => {
    ensureQuickViewModal();
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentCategory = btn.getAttribute('data-category');
            fetchProducts();
        });
    });

    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            searchQuery = searchInput.value.trim();
            fetchProducts();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchQuery = searchInput.value.trim();
                fetchProducts();
            }
        });
    }

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentSort = sortSelect.value;
            applyClientTransformations();
        });
    }

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            visibleCount += PRODUCTS_PAGE_SIZE;
            applyClientTransformations();
        });
    }

    // Initial load
    fetchProducts();
});
