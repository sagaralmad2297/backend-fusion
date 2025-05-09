const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const mongoose = require('mongoose');

// Helper: Format product with exactly 3 images
const formatProduct = (productDoc, addedAt) => {
  const product = productDoc.toObject ? productDoc.toObject() : productDoc;
  return {
    ...product,
    images: product.images.slice(0, 3), // Ensure only 3 images
    addedAt,
    formattedPrice: `₹${product.price?.toFixed(2) || '0.00'}`
  };
};

// Get paginated wishlist
exports.getWishlist = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const wishlist = await Wishlist.findOne({ userId: req.user._id })
      .populate({
        path: "products.productId",
        select: "name description price sizes category stock images brand createdAt"
      });

    if (!wishlist || wishlist.products.length === 0) {
      return res.status(200).json({
        status: 200,
        message: "Wishlist is empty",
        data: {
          products: [],
          pagination: {
            totalItems: 0,
            totalPages: 0,
            currentPage: page,
            pageSize: limit
          }
        }
      });
    }

    const formattedProducts = wishlist.products.map(item => 
      formatProduct(item.productId, item.addedAt)
    );

    const paginatedProducts = formattedProducts.slice(skip, skip + limit);

    res.status(200).json({
      status: 200,
      message: "Wishlist fetched successfully",
      data: {
        products: paginatedProducts,
        pagination: {
          totalItems: formattedProducts.length,
          totalPages: Math.ceil(formattedProducts.length / limit),
          currentPage: page,
          pageSize: limit
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Error fetching wishlist",
      error: error.message
    });
  }
};

// Add to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid product ID format"
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 404,
        message: "Product not found"
      });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId: req.user._id,
        products: [{ productId }]
      });
    } else {
      const exists = wishlist.products.some(
        item => item.productId.toString() === productId
      );
      if (exists) return res.status(400).json({
        status: 400,
        message: "Product already in wishlist"
      });
      wishlist.products.push({ productId });
    }

    await wishlist.save();

    res.status(200).json({
      status: 200,
      message: "Product added to wishlist",
      data: {
        product: formatProduct(product, wishlist.products.find(
          item => item.productId.toString() === productId
        ).addedAt)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Error adding to wishlist",
      error: error.message
    });
  }
};

// Remove item from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid product ID format"
      });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { products: { productId } } },
      { new: true }
    ).populate('products.productId');

    if (!wishlist) {
      return res.status(404).json({
        status: 404,
        message: "Wishlist not found"
      });
    }

    res.status(200).json({
      status: 200,
      message: "Product removed from wishlist",
      data: {
        wishlist: {
          products: wishlist.products.map(item => 
            formatProduct(item.productId, item.addedAt)
          )
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Error removing from wishlist",
      error: error.message
    });
  }
};

// Clear entire wishlist
exports.clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: req.user._id },
      { products: [] },
      { new: true }
    );

    if (!wishlist) {
      return res.status(404).json({
        status: 404,
        message: "Wishlist not found"
      });
    }

    res.status(200).json({
      status: 200,
      message: "Wishlist cleared successfully",
      data: {
        wishlist: {
          products: []
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Error clearing wishlist",
      error: error.message
    });
  }
};