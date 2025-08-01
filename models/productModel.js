// {
//   "_id": "507f1f77bcf86cd799439011",
//   "store": "5f8d0d55b54764421b7156da",
//   "name": "Premium Wireless Headphones",
//   "slug": "premium-wireless-headphones",
//   "description": "Noise-cancelling Bluetooth headphones with 30-hour battery life",
//   "basePrice": 199.99,
//   "discountPrice": 149.99,
//   "discountStart": "2023-11-20T00:00:00.000Z",
//   "discountEnd": "2023-12-31T23:59:59.000Z",
//   "category": "5f8d0d55b54764421b7156db",
//   "images": [
//     "https://example.com/images/headphones-1.jpg",
//     "https://example.com/images/headphones-2.jpg"
//   ],
//   "variants": [
//     {
//       "name": "Color",
//       "isDeleted": false,
//       "options": [
//         {
//           "value": "Black",
//           "priceModifier": 0,
//           "stock": 50,
//           "sku": "HP-BLK-001"
//         },
//         {
//           "value": "Silver",
//           "priceModifier": 10,
//           "stock": 25,
//           "sku": "HP-SLV-001"
//         }
//       ]
//     },
//     {
//       "name": "Warranty",
//       "isDeleted": false,
//       "options": [
//         {
//           "value": "1 Year",
//           "priceModifier": 0,
//           "stock": -1,  // -1 indicates unlimited stock
//           "sku": ""
//         },
//         {
//           "value": "2 Years",
//           "priceModifier": 25,
//           "stock": -1,
//           "sku": ""
//         }
//       ]
//     }
//   ],
//   "averageRating": 4.5,
//   "reviewCount": 42,
//   "createdBy": "5f8d0d55b54764421b7156dc",
//   "isDeleted": false,
//   "createdAt": "2023-11-15T10:00:00.000Z",
//   "updatedAt": "2023-11-18T14:30:00.000Z"
// }





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
