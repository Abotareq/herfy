// {
//   "user": "65ff32fae201f6b1b3d7c9ef",
//   "entityId": "65ff3401e201f6b1b3d7c9f0", // product id
//   "entityType": "Product",
//   "rating": 4,
//   "comment": "منتج بايظ"
// }


// const mongoose = require('mongoose');
import mongoose from "mongoose";
import { addDocument } from "../rag/vectorStore.js";
import Embedding from "./Embedding.js";

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
// -------------------- Auto Incremental RAG Training Hooks -------------------- //

// After creating or updating a review
reviewSchema.post('save', async function(doc) {
  try {
    const content = `Review by User: ${doc.user}, Entity: ${doc.entityType}-${doc.entityId}, Rating: ${doc.rating}, Comment: ${doc.comment || ''}`;
    await addDocument(`${doc._id}`, content, { type: 'review', reviewId: doc._id, entityType: doc.entityType, entityId: doc.entityId, userId: doc.user });
    console.log(`RAG embeddings updated for review ${doc._id}`);
  } catch (err) {
    console.error('RAG auto-train error for Review:', err.message);
  }
});

// After findOneAndUpdate
reviewSchema.post('findOneAndUpdate', async function(doc) {
  if (!doc) return;
  try {
    const content = `Review by User: ${doc.user}, Entity: ${doc.entityType}-${doc.entityId}, Rating: ${doc.rating}, Comment: ${doc.comment || ''}`;
    await addDocument(`${doc._id}`, content, { type: 'review', reviewId: doc._id, entityType: doc.entityType, entityId: doc.entityId, userId: doc.user });
    console.log(`RAG embeddings updated for review ${doc._id} (update)`);
  } catch (err) {
    console.error('RAG auto-train error for Review (update):', err.message);
  }
});

// After removing a review: delete related embeddings
reviewSchema.post('remove', async function(doc) {
  try {
    await Embedding.deleteMany({ docId: `${doc._id}`, docType: 'review' });
    console.log(`🗑️ Deleted RAG embeddings for removed review ${doc._id}`);
  } catch (err) {
    console.error('RAG auto-train error for Review (remove):', err.message);
  }
});
const Review = mongoose.model('Review', reviewSchema);
export default Review;
// module.exports = Review;