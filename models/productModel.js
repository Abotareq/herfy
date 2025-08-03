import mongoose from 'mongoose';
import slugify from 'slugify';

const variantSchema = new mongoose.Schema({
  name: String,
  isDeleted: { type: Boolean, default: false },
  options: [{
    value: String,
    priceModifier: { type: Number, default: 0 },
    stock: Number,
    sku: String,
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
  basePrice: {
    type: Number,
    required: true,
  },
  discountPrice: { //added
    type: Number,
    default: 0,
  },
  discountStart: { //added
    type: Date,
  },
  discountEnd: { //added
    type: Date,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Category',
  },
  images: [{ type: String }],
  variants: [variantSchema],
  averageRating: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isDeleted: { type: Boolean, default: false }
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
