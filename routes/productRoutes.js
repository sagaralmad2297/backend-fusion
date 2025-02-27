const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// POST a new product (unprotected for now, we’ll add auth later)
router.post('/', async (req, res) => {
  try {
    const { name, description, price, sizes, category, stock, imageUrl } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category || !stock || !imageUrl) {
      return res.status(400).json({
        status: 400,
        message: 'All fields are required',
      });
    }

    // Create the product
    const product = new Product({
      name,
      description,
      price,
      sizes,
      category,
      stock,
      imageUrl,
    });

    // Save to database
    await product.save();

    // Send success response without product data
    res.status(201).json({
      status: 201,
      message: 'Product added successfully',
    });
  } catch (error) {
    // Send failure response with error message
    res.status(400).json({
      status: 400,
      message: error.message,
    });
  }
});

module.exports = router;