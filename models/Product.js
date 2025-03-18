// 🛠️ Updated Product Model (models/Product.js)
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
  },
  sizes: [{
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  }],
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Men', 'Women', 'Kids'],
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
  },
  imageUrl: {
    type: String,
    required: [true, 'Product image is required'],
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    enum: ['Nike', 'Pdidas', 'Yuma', 'Geebok', 'Over Arm', 'Neo'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual property for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return `₹${this.price.toFixed(2)}`;
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);