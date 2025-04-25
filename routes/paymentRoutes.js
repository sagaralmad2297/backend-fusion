const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const router = express.Router();

// Initialize Razorpay instance with your credentials
const razorpay = new Razorpay({
  key_id: 'YOUR_RAZORPAY_KEY_ID',  // Replace with your Razorpay key ID
  key_secret: 'YOUR_RAZORPAY_KEY_SECRET',  // Replace with your Razorpay key secret
});

// Route to create a Razorpay order
router.post('/payment/order', async (req, res) => {
  const { amount } = req.body; // Amount should be in paise (1 INR = 100 paise)
  
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `order_rcptid_${Math.random().toString(36).substring(7)}`,
    });

    res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Route to verify payment and place the order
router.post('/order/place', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
  
  // Create a string to generate the expected signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  
  // Generate the expected signature using the key secret
  const expected_signature = crypto
    .createHmac('sha256', 'YOUR_RAZORPAY_KEY_SECRET') // Use your Razorpay key secret
    .update(body)
    .digest('hex');
  
  // Check if the generated signature matches the received signature
  if (expected_signature === razorpay_signature) {
    console.log('Payment verified successfully');

    // Save the order to the database (this is a placeholder, replace with your DB logic)
    const orderDetails = { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount };
    // Save the order details in your database

    res.status(200).json({ message: 'Order placed successfully' });
  } else {
    res.status(400).json({ message: 'Payment verification failed' });
  }
});

module.exports = router;
