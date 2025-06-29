// {
//   "user": "665d1b8fd5e1b2c5d9a66f11",
//   "items": [
//     {
//       "product": "665d1b8fd5e1b2c5d9a66f21",
//       "quantity": 2,
//       "variant": {
//         "Color": "Red",
//         "Size": "Large"
//       }
//     },
//     {
//       "product": "665d1b8fd5e1b2c5d9a66f22",
//       "quantity": 1
//     }
//   ],
//   "coupon": "665d1b8fd5e1b2c5d9a66f99"
// }

import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    // Optional: store variant details if your product has them
    variant: {
      type: Map,
      of: String, // e.g., { "Color": "Red", "Size": "Large" }
    }
  }],
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon' // Assumes you might create a Coupon model later
  }
}, {
  timestamps: true
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;