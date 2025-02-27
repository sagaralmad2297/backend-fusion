const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// ✅ POST a new product
router.post('/', async (req, res) => {
  try {
    const { name, description, price, sizes, category, stock, imageUrl } = req.body;

    if (!name || !description || !price || !category || !stock || !imageUrl) {
      return res.status(400).json({ status: 400, message: 'All fields are required' });
    }

    const product = new Product({ name, description, price, sizes, category, stock, imageUrl });
    await product.save();

    res.status(201).json({ status: 201, message: 'Product added successfully' });
  } catch (error) {
    res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
  }
});

// ✅ GET all products with pagination
router.get('/', async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = parseInt(page) || 1; // Default: page 1
    limit = parseInt(limit) || 10; // Default: 10 items per page

    const totalItems = await Product.countDocuments();
    const totalPages = Math.ceil(totalItems / limit);
    const products = await Product.find()
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      status: 200,
      message: 'Products fetched successfully',
      data: {
        products,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          pageSize: limit,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
  }
});

// ✅ GET a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 404, message: 'Product not found' });
    }
    res.status(200).json({ status: 200, message: 'Product fetched successfully', data: product });
  } catch (error) {
    res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
  }
});

// ✅ UPDATE a product by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ status: 404, message: 'Product not found' });
    }

    res.status(200).json({ status: 200, message: 'Product updated successfully', data: updatedProduct });
  } catch (error) {
    res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
  }
});

// ✅ DELETE a product by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ status: 404, message: 'Product not found' });
    }

    res.status(200).json({ status: 200, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;
