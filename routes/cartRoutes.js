const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCartItem,
  deleteCartItem
} = require('../controllers/cartController');
const authenticate = require('../middleware/auth'); // ✅ Use a single, consistent import

// Routes
router.post('/add', authenticate, addToCart);
router.get('/', authenticate, getCart);
router.put('/update', authenticate, updateCartItem);
router.delete('/delete/:productId', authenticate, deleteCartItem);

module.exports = router;
