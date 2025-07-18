import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['fixed', 'percentage'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minCartTotal: {
    type: Number,
    default: 0 
  },
  maxDiscount: {
    type: Number,
    default: null 
  },
  expiryDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: 1 
  },
  usedCount: {
    type: Number,
    default: 0 
  },
  active: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true
});

export const Coupon = mongoose.model('Coupon', couponSchema);
