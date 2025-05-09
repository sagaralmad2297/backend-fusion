const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

// Prevent duplicate products in wishlist
wishlistSchema.index({ userId: 1, "products.productId": 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);