// Use the local backend in development and the Render backend in production.
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE_URL = isLocalhost
  ? 'http://localhost:5000/api'
  : 'https://ecommerce-backend-8z9r.onrender.com/api';

const API_ENDPOINTS = {
    products: `${API_BASE_URL}/products`,
    users: `${API_BASE_URL}/users`,
    cart: `${API_BASE_URL}/cart`,
    orders: `${API_BASE_URL}/orders`
};
