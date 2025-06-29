// {
//   "user": "65ff32fae201f6b1b3d7c9ef",
//   "entityId": "65ff3401e201f6b1b3d7c9f0", // product id
//   "entityType": "Product",
//   "rating": 4,
//   "comment": "منتج بايظ"
// }



// const mongoose = require('mongoose');
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  entityId: { // The ID of the product OR the store being reviewed
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Product', 'Store'], // Specifies what is being reviewed
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// To ensure a user can only review a specific product/store once
reviewSchema.index({ user: 1, entityId: 1, entityType: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
// module.exports = Review;