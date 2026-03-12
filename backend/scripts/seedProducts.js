const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const seedProducts = require('../data/seedProducts');

dotenv.config({ path: require('path').join(__dirname, '..', '.env') });

async function run() {
  try {
    await connectDB();

    await Product.deleteMany({});
    await Product.insertMany(seedProducts);

    console.log(`Seeded ${seedProducts.length} products successfully.`);
    process.exit(0);
  } catch (error) {
    console.error(`Failed to seed products: ${error.message}`);
    process.exit(1);
  }
}

run();
