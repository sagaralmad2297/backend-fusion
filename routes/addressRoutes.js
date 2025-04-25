const express = require('express');
const router = express.Router();
const {
  addAddress,
  getAddress,
  updateAddress,
  deleteAddress
} = require('../controllers/addressController');
const authenticate = require('../middleware/auth'); // ✅ Use a single, consistent import

// Routes
router.post('/', authenticate, addAddress);
router.get('/', authenticate, getAddress);
router.put('/:id', authenticate, updateAddress);
router.delete('/:id', authenticate, deleteAddress);

module.exports = router;
