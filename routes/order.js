const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrdersByUser,
  getOrderById,
  updateOrder,
  deleteOrder,
  downloadInvoice
} = require('../controllers/orderController');
const authenticate = require('../middleware/auth');

// Routes
router.post('/create', authenticate, createOrder);                // Create an order from the user's cart
router.get('/', authenticate, getAllOrders);                      // Admin: Get all orders
router.get('/user', authenticate, getOrdersByUser);               // Get orders for the authenticated user
router.get('/:id', authenticate, getOrderById);                   // Get single order by order ID
router.put('/:id', authenticate, updateOrder);                    // Update order status/payment status
router.delete('/:id', authenticate, deleteOrder);                 // Delete an order
router.get('/invoice/:id', authenticate, downloadInvoice);

module.exports = router;
