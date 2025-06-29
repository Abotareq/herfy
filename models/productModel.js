// {
//   name: "  قلة سوهاجبة فاخرة",
//   slug: "قلة",
//   basePrice: 120,
//   variants: [
//     {
//       name: "Color",
//       options: [
//         { value: "Red", priceModifier: 10, stock: 5, sku: "QU-RED" },
//         { value: "Blue", priceModifier: 0, stock: 8, sku: "QU-BLU" }
//       ]
//     }
//   ]
// }

import mongoose from 'mongoose';
import slugify from 'slugify';

// Sub-document => Color (Red, Blue) and Size (Small, Large)
const variantSchema = new mongoose.Schema({
  name: String, // e.g., "Color"
  options: [{
    value: String, // e.g., "Red", "Large"
    priceModifier: { type: Number, default: 0 }, // To add cost for certain options
    stock: Number,
    sku: String, // Unique Stock => (serial number) 
  }],
});

const productSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Store',
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: String,
  description: {
    type: String,
    required: true,
  },
  basePrice: { // The starting price of the product
    type: Number,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Category',
  },
  images: [{ type: String }],
  variants: [variantSchema], // Array of variant sub-documents
  averageRating: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;