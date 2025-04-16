const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCartItem,
  deleteCartItem,clearCart
} = require('../controllers/cartController');
const authenticate = require('../middleware/auth'); // ✅ Use a single, consistent import

// Routes
router.post('/add', authenticate, addToCart);
router.get('/', authenticate, getCart);
router.put('/update', authenticate, updateCartItem);
router.delete('/delete/:itemId/:size', authenticate, deleteCartItem);
router.delete("/clear", authenticate, clearCart);

module.exports = router;
