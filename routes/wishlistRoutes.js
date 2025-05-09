const express = require('express');
const router = express.Router();
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  clearWishlist
} = require('../controllers/wishlistController');
const authenticate = require('../middleware/auth');

// GET /api/wishlist - Get wishlist
router.get('/', authenticate, getWishlist);

// POST /api/wishlist - Add to wishlist
router.post('/add', authenticate, addToWishlist);

// DELETE /api/wishlist/clear - Clear entire wishlist (MUST come before :productId)
router.delete('/clear', authenticate, clearWishlist);

// DELETE /api/wishlist/:productId - Remove single item
router.delete('/:productId', authenticate, removeFromWishlist);

module.exports = router;