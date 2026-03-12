const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const seedProducts = require('../data/seedProducts');
const { mapExternalProduct, extractItems } = require('../utils/productMapper');

// Get all products
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Seed default products
router.post('/seed', async (req, res) => {
  try {
    await Product.deleteMany({});
    const inserted = await Product.insertMany(seedProducts);

    res.status(201).json({
      message: 'Products seeded successfully',
      count: inserted.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Import products from an external API URL
router.post('/import-url', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'url is required' });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ message: `Failed to fetch source: ${response.status}` });
    }

    const payload = await response.json();
    const rawItems = extractItems(payload);
    const mappedProducts = rawItems.map(mapExternalProduct).filter(Boolean);

    if (mappedProducts.length === 0) {
      return res.status(400).json({ message: 'No valid products found in source response' });
    }

    await Product.deleteMany({});
    const inserted = await Product.insertMany(mappedProducts);

    return res.status(201).json({
      message: 'Products imported successfully',
      count: inserted.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new product (admin only)
router.post('/', async (req, res) => {
  try {
    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: req.body.image,
      stock: req.body.stock
    });
    
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    Object.assign(product, req.body);
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
