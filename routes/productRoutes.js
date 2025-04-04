const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// ⚒️ GET Endpoint - Get all products with filters
// ⚒️ GET Endpoint - Get all products with filters + sorting + pagination
router.get('/', async (req, res) => {
  try {
    let { 
      page, 
      limit, 
      category, 
      minPrice, 
      maxPrice, 
      sizes, 
      brands,
      sort 
    } = req.query;

    // Pagination defaults
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    // Build filter object
    const filter = {};

    if (category) filter.category = category;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (sizes) {
      const sizesArray = Array.isArray(sizes) ? sizes : sizes.split(',');
      filter.sizes = { $in: sizesArray };
    }

    if (brands) {
      const brandsArray = Array.isArray(brands) ? brands : brands.split(',');
      filter.brand = { $in: brandsArray };
    }

    // Sorting
    let sortOption = {};
    if (sort === 'price_asc') sortOption.price = 1;
    else if (sort === 'price_desc') sortOption.price = -1;

    // Execute query
    const totalItems = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);
    const products = await Product.find(filter)
      .sort(sortOption)
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


// ⚒️ POST Endpoint - Create new product
router.post('/', async (req, res) => {
  try {
    const { name, description, price, sizes, category, stock, images, brand } = req.body;

    // Required fields validation
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

// ⚒️ PUT Endpoint - Update product
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

// ⚒️ DELETE Endpoint - Delete product
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

