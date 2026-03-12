const normalizeCategory = (rawCategory) => {
  const value = String(rawCategory || '').toLowerCase();

  if (value.includes('elect')) return 'Electronics';
  if (value.includes('sport') || value.includes('fitness') || value.includes('outdoor')) return 'Sports';
  if (value.includes('home') || value.includes('kitchen') || value.includes('furniture')) return 'Home';
  if (value.includes('access') || value.includes('fashion') || value.includes('wear') || value.includes('bag')) return 'Accessories';

  return 'Accessories';
};

const mapExternalProduct = (item) => {
  const name = item.name || item.title || item.product_name || item.productTitle;
  const description = item.description || item.short_description || item.product_description || 'No description available';
  const rawPrice = item.price ?? item.current_price ?? item.sale_price ?? item.amount;
  const price = Number(rawPrice);

  const image =
    item.image ||
    item.thumbnail ||
    item.image_url ||
    (Array.isArray(item.images) ? item.images[0] : undefined) ||
    'https://via.placeholder.com/300';

  const stockValue = item.stock ?? item.quantity ?? item.inventory ?? 10;
  const stock = Number(stockValue);

  const ratingValue = item.ratings ?? item.rating ?? item.score ?? 0;
  const ratings = Number(ratingValue);

  const reviewsValue = item.numReviews ?? item.review_count ?? item.reviews ?? 0;
  const numReviews = Number(reviewsValue);

  if (!name || Number.isNaN(price) || price <= 0) {
    return null;
  }

  return {
    name: String(name).slice(0, 180),
    description: String(description).slice(0, 1000),
    price,
    category: normalizeCategory(item.category || item.category_name || item.department),
    image,
    stock: Number.isFinite(stock) ? Math.max(0, stock) : 0,
    ratings: Number.isFinite(ratings) ? ratings : 0,
    numReviews: Number.isFinite(numReviews) ? numReviews : 0,
  };
};

const extractItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.products)) return payload.products;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

module.exports = {
  mapExternalProduct,
  extractItems,
};
