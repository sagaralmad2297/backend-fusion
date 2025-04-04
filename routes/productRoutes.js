const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/Product');

// ✅ POST /api/products/get - Get filtered products
router.post('/get', async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      category,
      minPrice,
      maxPrice,
      sizes,
      brands,
      sort
    } = req.body;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const skip = (page - 1) * limit;
    const filter = {};

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // Sizes filter
    if (Array.isArray(sizes) && sizes.length > 0) {
      filter.sizes = { $in: sizes };
    }

    // Brands filter
    if (Array.isArray(brands) && brands.length > 0) {
      filter.brand = { $in: brands };
    }

    // Sorting
    let sortOption = {};
    if (sort === 'price_asc') sortOption.price = 1;
    else if (sort === 'price_desc') sortOption.price = -1;
    else if (sort === 'newest') sortOption.createdAt = -1;
    else if (sort === 'oldest') sortOption.createdAt = 1;

    // Fetch from DB
    const totalItems = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
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
          pageSize: limit
        }
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

// ✅ POST /api/products - Create new product
router.post('/', async (req, res) => {
  try {
    const { name, description, price, sizes, category, stock, images, brand } = req.body;

    const requiredFields = ['name', 'description', 'price', 'category', 'stock', 'images', 'brand'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 400,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    if (!Array.isArray(images) || images.length < 1) {
      return res.status(400).json({
        status: 400,
        message: 'At least one product image is required',
      });
    }

    const product = new Product({
      name,
      description,
      price,
      sizes,
      category,
      stock,
      images,
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

// ✅ PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid Product ID'
      });
    }

    if (updates.price !== undefined && updates.price < 0) {
      return res.status(400).json({
        status: 400,
        message: 'Price cannot be negative'
      });
    }

    if (updates.images && (!Array.isArray(updates.images) || updates.images.length < 1)) {
      return res.status(400).json({
        status: 400,
        message: 'At least one product image is required',
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

// ✅ DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid Product ID'
      });
    }

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






 /*## 🛍️ Product API Documentation

### 🔗 Base URL
```
http://localhost:5000/api/products
```

---

### 📥 1. Get All Products
**Method:** `GET`

**URL:** `/api/products`

#### ✅ Query Parameters (optional):
| Parameter  | Type     | Description                                      |
|------------|----------|--------------------------------------------------|
| `page`     | Number   | Page number (default: 1)                         |
| `limit`    | Number   | Items per page (default: 10)                     |
| `category` | String   | Filter by category: `Men`, `Women`, `Kids`       |
| `minPrice` | Number   | Filter products with price >= minPrice          |
| `maxPrice` | Number   | Filter products with price <= maxPrice          |
| `sizes`    | String[] | Filter by sizes: `XS`, `S`, `M`, `L`, `XL`, `XXL`|
| `brands`   | String[] | Filter by brands: `Nike`, `Pdidas`, etc.        |

#### 🔍 Example:
```
GET /api/products?category=Men&minPrice=500&maxPrice=2000&sizes=M,L&brands=Nike,Yuma
```

---

### 📤 2. Create New Product
**Method:** `POST`

**URL:** `/api/products`

#### 📦 Request Body:
```json
{
  "name": "Slim Fit T-Shirt",
  "description": "Comfortable and stylish T-shirt",
  "price": 899,
  "sizes": ["S", "M", "L"],
  "category": "Men",
  "stock": 120,
  "images": ["https://example.com/images/shirt1.jpg"],
  "brand": "Nike"
}
```

---

### ✏️ 3. Update Product
**Method:** `PUT`

**URL:** `/api/products/:id`

#### 🔄 Example URL:
```
/api/products/66102e4bdb0a7611b36babc1
```

#### ✍️ Example Payload:
```json
{
  "price": 799,
  "stock": 150,
  "images": ["https://example.com/images/shirt1-new.jpg"]
}
```

---

### ❌ 4. Delete Product
**Method:** `DELETE`

**URL:** `/api/products/:id`

#### 🗑️ Example URL:
```
/api/products/66102e4bdb0a7611b36babc1
```

---

### 📘 Notes
- All image fields must be valid URLs.
- Brands must be one of: `Nike`, `Pdidas`, `Yuma`, `Geebok`, `Over Arm`, `Norvix`
- Sizes must be one of: `XS`, `S`, `M`, `L`, `XL`, `XXL`
- Category must be one of: `Men`, `Women`, `Kids` */

