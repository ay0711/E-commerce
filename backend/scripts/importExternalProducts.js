const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const { mapExternalProduct, extractItems } = require('../utils/productMapper');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const argv = process.argv.slice(2);
const sourceUrl = argv[0] || process.env.EXTERNAL_PRODUCTS_API_URL;
const provider = (argv[1] || process.env.EXTERNAL_PRODUCTS_PROVIDER || 'generic').toLowerCase();

if (!sourceUrl) {
  console.error('Missing source URL. Usage: npm run import:products -- <url> [provider]');
  process.exit(1);
}

async function run() {
  try {
    await connectDB();

    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Source request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const rawItems = extractItems(payload);

    if (rawItems.length === 0) {
      throw new Error('No products found in the source response');
    }

    const mappedProducts = rawItems
      .map((item) => mapExternalProduct(item, provider))
      .filter(Boolean);

    if (mappedProducts.length === 0) {
      throw new Error('No importable products found after mapping');
    }

    await Product.deleteMany({});
    await Product.insertMany(mappedProducts);

    console.log(`Imported ${mappedProducts.length} products from ${provider} source.`);
    process.exit(0);
  } catch (error) {
    console.error(`Import failed: ${error.message}`);
    process.exit(1);
  }
}

run();
