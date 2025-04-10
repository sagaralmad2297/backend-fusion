const Cart = require('../models/Cart');

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user?.userId; // ✅ From auth middleware
    const { productId, quantity } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "User not authenticated. Please log in.",
      });
    }

    if (!productId || !quantity) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Product ID and quantity are required.",
      });
    }

    let cart = await Cart.findOne({ userId });

    if (cart) {
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }

      await cart.save();

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Item added to cart successfully.",
        data: cart,
      });
    } else {
      // Create a new cart
      cart = new Cart({
        userId,
        items: [{ productId, quantity }],
      });

      await cart.save();

      return res.status(201).json({
        status: 201,
        success: true,
        message: "Item added to cart successfully.",
        data: cart,
      });
    }
  } catch (error) {
    console.error("Add to cart error:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Something went wrong while adding to cart.",
    });
  }
};


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
  
      res.status(200).json({
        status: 200,
        success: true,
        message: "Cart fetched successfully.",
        data: cart,
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

  exports.updateCartItem = async (req, res) => {
    try {
      const userId = req.user?.userId;
      const { productId, quantity } = req.body;
  
      if (!userId || !productId || quantity < 1) {
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
  
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex === -1) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "Item not found in cart.",
        });
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

  exports.deleteCartItem = async (req, res) => {
    try {
      const userId = req.user?.userId;
      const productId = req.params.productId;
  
      if (!userId) {
        return res.status(401).json({
          status: 401,
          success: false,
          message: "User not authenticated.",
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
  
      cart.items = cart.items.filter(item => item.productId.toString() !== productId);
      await cart.save();
  
      res.status(200).json({
        status: 200,
        success: true,
        message: "Item removed from cart successfully.",
        data: cart,
      });
    } catch (error) {
      console.error("Delete cart item error:", error);
      res.status(500).json({
        status: 500,
        success: false,
        message: "Failed to remove item from cart.",
      });
    }
  };
  