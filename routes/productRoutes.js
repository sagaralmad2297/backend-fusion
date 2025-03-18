// routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// 🛠️ GET Endpoint - Get all products with filters
router.get('/', async (req, res) => {
  try {
    let { 
      page, 
      limit, 
      category, 
      minPrice, 
      maxPrice, 
      sizes, 
      brands 
    } = req.query;

    // Pagination defaults
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    // Build filter object
    const filter = {};

    // Category filter
    if (category) filter.category = category;

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Sizes filter
    if (sizes) {
      const sizesArray = Array.isArray(sizes) ? sizes : sizes.split(',');
      filter.sizes = { $in: sizesArray };
    }

    // Brands filter
    if (brands) {
      const brandsArray = Array.isArray(brands) ? brands : brands.split(',');
      filter.brand = { $in: brandsArray };
    }

    // Execute query
    const totalItems = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);
    const products = await Product.find(filter)
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
    res.status(500).json({ 
      status: 500, 
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
});

// 🛠️ POST Endpoint - Create new product
router.post('/', async (req, res) => {
  try {
    const { name, description, price, sizes, category, stock, imageUrl, brand } = req.body;

    // Required fields validation
    const requiredFields = ['name', 'description', 'price', 'category', 'stock', 'imageUrl', 'brand'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 400,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const product = new Product({ 
      name, 
      description, 
      price, 
      sizes, 
      category, 
      stock, 
      imageUrl, 
      brand 
    });

    await product.save();

    res.status(201).json({ 
      status: 201, 
      message: 'Product added successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({ 
      status: 500, 
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
});

// 🛠️ PUT Endpoint - Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate price
    if (updates.price !== undefined && updates.price < 0) {
      return res.status(400).json({ 
        status: 400, 
        message: 'Price cannot be negative' 
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ 
        status: 404, 
        message: 'Product not found' 
      });
    }

    res.status(200).json({
      status: 200,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({ 
      status: 500, 
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
});

// 🛠️ DELETE Endpoint - Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ 
        status: 404, 
        message: 'Product not found' 
      });
    }

    res.status(200).json({ 
      status: 200, 
      message: 'Product deleted successfully',
      data: {
        _id: deletedProduct._id,
        name: deletedProduct.name,
        price: deletedProduct.price
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 500, 
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
});

module.exports = router;




/* 📚 API ENDPOINTS & EXAMPLES */

// 1️⃣ CREATE PRODUCT
// POST /api/products
// Request Body:
/*
{
  "name": "Men's Running Shoes",
  "description": "Lightweight running shoes with cushioning",
  "price": 3499,
  "sizes": ["M", "L"],
  "category": "Men",
  "stock": 25,
  "imageUrl": "https://example.com/shoes.jpg",
  "brand": "Nike"
}
*/
// Success Response (201):
/*
{
  "status": 201,
  "message": "Product added successfully"
}
*/
// Error Response (400):
/*
{
  "status": 400,
  "message": "Validation failed",
  "errors": {
    "brand": "Brand is required",
    "price": "Price cannot be negative"
  }
}
*/

// 2️⃣ GET ALL PRODUCTS (WITH FILTERS)
// GET /api/products?page=1&limit=10&category=Men&minPrice=1000&maxPrice=5000&sizes=M&brands=Nike
// Success Response (200):
/*
{
  "status": 200,
  "message": "Products fetched successfully",
  "data": {
    "products": [
      {
        "_id": "665a1f2b3e4b5c6d7e8f9a1",
        "name": "Men's Running Shoes",
        "description": "Lightweight running shoes...",
        "price": 3499,
        "formattedPrice": "₹3499.00",
        "sizes": ["M", "L"],
        "category": "Men",
        "stock": 25,
        "imageUrl": "https://example.com/shoes.jpg",
        "brand": "Nike",
        "createdAt": "2024-05-31T12:34:56.789Z"
      }
    ],
    "pagination": {
      "totalItems": 1,
      "totalPages": 1,
      "currentPage": 1,
      "pageSize": 10
    }
  }
}
*/

// 3️⃣ GET SINGLE PRODUCT
// GET /api/products/665a1f2b3e4b5c6d7e8f9a1
// Success Response (200):
/*
{
  "status": 200,
  "message": "Product fetched successfully",
  "data": {
    "_id": "665a1f2b3e4b5c6d7e8f9a1",
    "name": "Men's Running Shoes",
    "description": "Lightweight running shoes...",
    "price": 3499,
    "formattedPrice": "₹3499.00",
    "sizes": ["M", "L"],
    "category": "Men",
    "stock": 25,
    "imageUrl": "https://example.com/shoes.jpg",
    "brand": "Nike",
    "createdAt": "2024-05-31T12:34:56.789Z"
  }
}
*/
// Not Found Response (404):
/*
{
  "status": 404,
  "message": "Product not found"
}
*/

// 4️⃣ UPDATE PRODUCT
// PUT /api/products/665a1f2b3e4b5c6d7e8f9a1
// Request Body:
/*
{
  "price": 2999,
  "stock": 20
}
*/
// Success Response (200):
/*
{
  "status": 200,
  "message": "Product updated successfully",
  "data": {
    "_id": "665a1f2b3e4b5c6d7e8f9a1",
    "name": "Men's Running Shoes",
    "description": "Lightweight running shoes...",
    "price": 2999,
    "formattedPrice": "₹2999.00",
    "sizes": ["M", "L"],
    "category": "Men",
    "stock": 20,
    "imageUrl": "https://example.com/shoes.jpg",
    "brand": "Nike",
    "createdAt": "2024-05-31T12:34:56.789Z"
  }
}
*/

// 5️⃣ DELETE PRODUCT
// DELETE /api/products/665a1f2b3e4b5c6d7e8f9a1
// Success Response (200):
/*
{
  "status": 200,
  "message": "Product deleted successfully",
  "deletedProduct": {
    "_id": "665a1f2b3e4b5c6d7e8f9a1",
    "name": "Men's Running Shoes",
    "formattedPrice": "₹2999.00"
  }
}
*/

// 🛑 COMMON ERROR RESPONSES
// 500 Internal Server Error:
/*
{
  "status": 500,
  "message": "Internal Server Error",
  "error": "Database connection failed"
}
*/

// 🔍 FILTERING PARAMETERS (FOR GET /products)
/*
?category=Men       // Filter by category (Men/Women/Kids)
?minPrice=1000      // Minimum price in INR
?maxPrice=5000      // Maximum price in INR
?sizes=M,XL         // Comma-separated sizes (XS/S/M/L/XL/XXL)
?brands=Nike,Pdidas // Comma-separated brands
?page=2             // Pagination page number
?limit=20           // Items per page (default: 10)
*/

// 💡 SAMPLE USAGE SCENARIOS
// 1. Get all Women's shoes under ₹3000:
// GET /products?category=Women&maxPrice=3000

// 2. Get Nike products in size M:
// GET /products?brands=Nike&sizes=M

// 3. Get second page of Kids products:
// GET /products?category=Kids&page=2&limit=15