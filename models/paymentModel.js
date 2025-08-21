// {
//   "order": "665d1b8fd5e1b2c5d9a66f12",
//   "user": "665d1b8fd5e1b2c5d9a66f11",
//   "amount": 250.00,
//   "paymentMethod": "credit_card",
//   "status": "completed",
//   "transactionId": "ch_1J2Y3Z4A5B6C7D8E9F0G",
//   "provider": "visa",
//   "error": null,
//   "createdAt": "2025-06-29T12:34:56.789Z",
//   "updatedAt": "2025-06-29T12:35:10.123Z"
// }

import mongoose from "mongoose";
import { addDocument } from "../rag/vectorStore.js";
import Embedding from "./Embedding.js";

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['credit_card', 'paypal', 'cash_on_delivery'],
    default: 'credit_card',
  },

  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  transactionId: String, // From payment provider
  provider: String, // visa, PayPal
  error: String, // Error message if failed
  // new 
  stripeSessionId: {
    type: String,
    default: null,
  }, // For linking Stripe Checkout session IDs

  refundedAt: {
    type: Date,
    default: null,
  }, // When payment was refunded
}, {
  timestamps: true,
});

// -------------------- Auto Incremental RAG Training -------------------- //
// After create/update
paymentSchema.post('save', async function(doc) {
  try {
    const content = `Payment for Order: ${doc.order}, User: ${doc.user}, Amount: ${doc.amount}, Method: ${doc.paymentMethod}, Status: ${doc.status}, Provider: ${doc.provider}, Transaction ID: ${doc.transactionId}`;
    await addDocument(`${doc._id}`, content, {
      type: 'payment',
      paymentId: doc._id,
      userId: doc.user,
      orderId: doc.order,
    });
    console.log(`RAG embeddings updated for payment ${doc._id}`);
  } catch (err) {
    console.error('RAG auto-train error for Payment:', err.message);
  }
});

paymentSchema.post('findOneAndUpdate', async function(doc) {
  if (!doc) return;
  try {
    const content = `Payment for Order: ${doc.order}, User: ${doc.user}, Amount: ${doc.amount}, Method: ${doc.paymentMethod}, Status: ${doc.status}, Provider: ${doc.provider}, Transaction ID: ${doc.transactionId}`;
    await addDocument(`${doc._id}`, content, {
      type: 'payment',
      paymentId: doc._id,
      userId: doc.user,
      orderId: doc.order,
    });
    console.log(`RAG embeddings updated for payment ${doc._id} (update)`);
  } catch (err) {
    console.error('RAG auto-train error for Payment (update):', err.message);
  }
});

// After remove
paymentSchema.post('remove', async function(doc) {
  try {
    await Embedding.deleteMany({ docId: `${doc._id}`, docType: 'payment' });
    console.log(`Deleted RAG embeddings for removed payment ${doc._id}`);
  } catch (err) {
    console.error('RAG auto-train error for Payment (remove):', err.message);
  }
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment; 