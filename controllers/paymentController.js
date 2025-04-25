const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance with your credentials
const razorpay = new Razorpay({
  key_id: 'rzp_test_dLVvsTlfYv2h50',  // Replace with your Razorpay key ID
  key_secret: 'iCGv1zN3p7apoCp4H32FpjAk',  // Replace with your Razorpay key secret
});

// Controller to create a Razorpay order
exports.createOrder = async (req, res) => {
  const { amount } = req.body; // Amount should be in paise (1 INR = 100 paise)
  
  try {
    // Create Razorpay order
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
};

// Controller to verify Razorpay payment
exports.verifyPayment = (req, res) => {
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
    // Save the order details in your database (this is where your DB integration comes in)

    res.status(200).json({ message: 'Order placed successfully' });
  } else {
    res.status(400).json({ message: 'Payment verification failed' });
  }
};
