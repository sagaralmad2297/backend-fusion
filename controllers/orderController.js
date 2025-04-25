const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const PDFDocument = require('pdfkit');

// Create an order
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { userAddressId, transactionId, paymentStatus, orderStatus, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const { productId, name, images, size, quantity, price } = item;

      if (!productId || !name || !images || !size || !quantity || !price) {
        return res.status(400).json({ success: false, message: 'Missing item fields' });
      }

      const qty = parseInt(quantity);
      const itemPrice = parseFloat(price);

      if (isNaN(qty) || isNaN(itemPrice)) {
        return res.status(400).json({ success: false, message: 'Invalid price or quantity in item' });
      }

      totalAmount += qty * itemPrice;

      orderItems.push({
        productId,
        name,
        images: images.slice(0, 3),
        size,
        quantity: qty,
        price: itemPrice,
      });
    }

    const order = new Order({
      userId,
      userAddressId,
      items: orderItems,
      totalAmount,
      transactionId,
      paymentStatus,
      orderStatus,
    });

    await order.save();

    // Clear user's cart after placing the order
    await Cart.deleteMany({ userId });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('userId').populate('userAddressId');
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

// Get orders by user

exports.getOrdersByUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ userId }).populate('userAddressId');

    // Ensure the price field is present in each order item
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!item.price) {
          item.price = 0; // Default price if missing
        }
      });
    });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

// Get single order by ID

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId')
      .populate('userAddressId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Make sure the price is part of each item
    order.items.forEach(item => {
      // Make sure the price is included
      if (!item.price) {
        item.price = 0; // Default price if it's somehow missing
      }
    });

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};


// Update order (status or payment)
exports.updateOrder = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus, paymentStatus },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, message: 'Order updated', data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

// Delete order
exports.deleteOrder = async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

// Download invoice PDF
exports.downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userAddressId')
      .populate('userId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const doc = new PDFDocument({ margin: 50 });

    doc.on('error', (err) => {
      console.error('PDF Generation Error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'PDF generation failed' });
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order._id}.pdf`);
    doc.pipe(res);

    // Brand Name
    doc.font('Helvetica-Bold')
      .fontSize(26)
      .text('Fusion', { align: 'center' })
      .moveDown(0.5);

    // Invoice Title
    doc.font('Helvetica-Bold')
      .fontSize(20)
      .text('INVOICE', { align: 'center' })
      .moveDown(0.5);

    // Order Details
    doc.font('Helvetica')
      .fontSize(10)
      .text(`Order #: ${order._id}`, { align: 'center' })
      .text(`Date: ${order.createdAt.toLocaleDateString()}`, { align: 'center' })
      .text(`Status: ${order.orderStatus}`, { align: 'center' });

    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text(`Payment: ${order.paymentStatus || 'Pending'}`, { align: 'center' })
      .moveDown();

    // Customer Info
    doc.font('Helvetica')
      .fontSize(12)
      .text(`Email: ${order.userId?.email || 'Guest'}`)
      .moveDown(0.5);

    // Address
    if (order.userAddressId) {
      const addr = order.userAddressId;
      let addressLines = [];

      if (addr.addressLine1) addressLines.push(addr.addressLine1);
      if (addr.addressLine2) addressLines.push(addr.addressLine2);

      const cityStatePostal = [];
      if (addr.city) cityStatePostal.push(addr.city);
      if (addr.state) cityStatePostal.push(addr.state);
      if (addr.postalCode) cityStatePostal.push(addr.postalCode);
      if (cityStatePostal.length > 0) addressLines.push(cityStatePostal.join(', '));
      if (addr.country) addressLines.push(addr.country);

      if (addressLines.length > 0) {
        doc.fontSize(10)
          .text('Shipping Address:')
          .text(addressLines.join('\n'), { indent: 20 })
          .moveDown();
      }
    }

    // Table Column Layout (with spacing)
    const columns = {
      item: 50,
      quantity: 270,
      price: 340,
      total: 430
    };

    let y = doc.y + 20;

    // Table Header
    doc.font('Helvetica-Bold')
      .fontSize(10)
      .text('ITEM', columns.item, y)
      .text('QTY', columns.quantity, y)
      .text('PRICE', columns.price, y, { width: 70, align: 'right' })
      .text('TOTAL', columns.total, y, { width: 70, align: 'right' });

    y += 20;
    doc.font('Helvetica');

    // Table Content
    order.items.forEach(item => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      const itemTotal = price * quantity;

      doc.fontSize(10)
        .text(item.name, columns.item, y, { width: 200 })
        .text(quantity.toString(), columns.quantity, y)
        .text(`Rs.${price.toFixed(2)}`, columns.price, y, { width: 70, align: 'right' })
        .text(`Rs.${itemTotal.toFixed(2)}`, columns.total, y, { width: 70, align: 'right' });

      y += 25;
    });

    // Line after table
    doc.moveTo(columns.item, y)
      .lineTo(columns.total + 70, y)
      .stroke();

    // Order Total (with matching font style)
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('Total:', columns.price, y + 10, { width: 70, align: 'right' });

    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text(`Rs.${order.totalAmount.toFixed(2)}`, columns.total, y + 10, {
        width: 70,
        align: 'right'
      });

    // Footer
    const footerY = 750;
    if (doc.y > footerY) {
      doc.addPage();
    }
    
    

    doc.end();

  } catch (error) {
    console.error('Invoice Download Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate invoice',
        error: error.message
      });
    }
  }
};


