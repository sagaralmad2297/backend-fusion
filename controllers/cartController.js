const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Add to Cart with Price Handling

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { productId, quantity, size } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "User not authenticated. Please log in.",
      });
    }

    if (!productId || !quantity || !size) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Product ID, quantity, and size are required.",
      });
    }

    // Fetch product to get current price
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Product not found.",
      });
    }

    let cart = await Cart.findOne({ userId });

    if (cart) {
      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId && item.size === size
      );

      if (itemIndex > -1) {
        // Update quantity and refresh price
        cart.items[itemIndex].quantity += quantity;
        cart.items[itemIndex].price = product.price; // Update to current price
      } else {
        cart.items.push({
          productId,
          quantity,
          size,
          price: product.price,
          name: product.name,
          images: product.images.slice(0, 3),
        });
      }

      await cart.save();
    } else {
      cart = new Cart({
        userId,
        items: [
          {
            productId,
            quantity,
            size,
            price: product.price,
            name: product.name,
            images: product.images.slice(0, 3),
          },
        ],
      });
      await cart.save();
    }

    // Add totalPrice per item
    const cartWithItemTotals = {
      ...cart.toObject(),
      items: cart.items.map(item => ({
        ...item.toObject(),
        totalPrice: item.price * item.quantity,
      })),
    };

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Item added to cart successfully.",
      data: cartWithItemTotals,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Something went wrong while adding to cart.",
    });
  }
};



// Get Cart with Price Calculations
exports.getCart = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "User not authenticated. Please log in.",
      });
    }

    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Cart not found.",
      });
    }

    // Calculate total price for each item and subtotal for the entire cart
    const cartWithItemTotals = {
      ...cart.toObject(),
      items: cart.items.map(item => ({
        ...item.toObject(),
        totalPrice: item.productId.price * item.quantity // Calculate total price per item
      })),
    };

    // Calculate subtotal (sum of totalPrice for all items)
    const subtotal = cartWithItemTotals.items.reduce((sum, item) => {
      return sum + item.totalPrice; // Sum of all individual item total prices
    }, 0);

    res.status(200).json({
      status: 200,
      success: true,
      message: "Cart fetched successfully.",
      data: {
        ...cartWithItemTotals,
        subtotal // Add subtotal for the entire cart
      },
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to fetch cart.",
    });
  }
};



// Update Cart Item with Price Validation
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { productId, quantity, size } = req.body;

    if (!userId || !productId || quantity < 1 || !size) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Invalid request data.",
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Cart not found.",
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId && item.size === size
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Item not found in cart.",
      });
    }

    // Optionally refresh price from product if needed
    const product = await Product.findById(productId);
    if (product) {
      cart.items[itemIndex].price = product.price;
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    res.status(200).json({
      status: 200,
      success: true,
      message: "Cart item updated successfully.",
      data: cart,
    });
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to update cart item.",
    });
  }
};

// In cartController.js - make sure this function exists
exports.deleteCartItem = async (req, res) => {
  try {
    const userId = req.user.userId; // Changed from req.user?.userId
    const { itemId, size } = req.params;

    if (!userId) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "User not authenticated."
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Cart not found."
      });
    }

    const initialItemCount = cart.items.length;
    cart.items = cart.items.filter(
      item => !(item._id.toString() === itemId && item.size === size)
    );

    if (cart.items.length === initialItemCount) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Item not found in cart."
      });
    }

    await cart.save();

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Item removed successfully.",
      data: cart
    });
  } catch (error) {
    console.error("Delete item error:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to delete item."
    });
  }
};


// Clear Entire Cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.userId; // Changed from optional chaining since auth middleware ensures user exists

    if (!userId) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "User not authenticated."
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Cart not found."
      });
    }

    // Clear all items from the cart
    cart.items = [];
    await cart.save();

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Cart cleared successfully.",
      data: cart
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to clear cart."
    });
  }
};