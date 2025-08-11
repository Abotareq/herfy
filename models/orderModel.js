// Example =>
// {
//   "user": "665d1b8fd5e1b2c5d9a66f11",
//   "orderItems": [
//     {
//       "product": "665d1b8fd5e1b2c5d9a66f21",
//       "store": "665d1b8fd5e1b2c5d9a66f31",
//       "name": "Handmade Vase",
//       "quantity": 2,
//       "price": 120,
//       "image": "/images/vase.png"
//     }
//   ],
//   "shippingAddress": {
//     "street": "Al Shohadaa",
//     "city": "Juhayna",
//     "postalCode": "12345",
//     "country": "Egypt"
//   },
//   "payment": "665d1b8fd5e1b2c5d9a66f51",
//   "subtotal": 240,
//   "shippingFee": 20,
//   "tax": 10,
//   "totalAmount": 270,
//   "status": "paid",
//   "paidAt": "2025-06-29T12:36:00.000Z",
//   "shippedAt": null,
//   "deliveredAt": null
// }


import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  name: { type: String, required: true }, // Snapshot of product name
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // Snapshot of price at time of purchase
  image: { type: String, required: true }, // Snapshot of product image
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderItems: [orderItemSchema],
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, required: true, default: 0 },
  tax: { type: Number, required: true, default: 0 },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', "cancelled", "payment_failed", "refunded"],
    default: 'pending',
  },
  paidAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  storeDeleted: {
    type: Boolean,
    default: false, // Indicates if the store related to this order has been deleted
  },
  storeDeletedAt: Date, // Timestamp when the store was deleted
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);
export default Order
