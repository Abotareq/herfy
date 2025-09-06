
import mongoose from 'mongoose';
import Embedding from './Embedding.js';
import { addDocument } from '../rag/vectorStore.js';

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
      index: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    variant: [
      { name: String,
        value: String
      }
    ],
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  // case use 
  totalAfterDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
}

, {
  timestamps: true
});

// -------------------- Auto Incremental RAG Training -------------------- //

// After create/save
cartSchema.post("save", async function (doc) {
  try {
    const itemsContent = doc.items.map(
      (i) => `Product: ${i.product}, Qty: ${i.quantity}, Variant: ${JSON.stringify(i.variant)}, Price: ${i.price}`
    ).join(" | ");

    const content = `Cart for user: ${doc.user}, Items: ${itemsContent}, Coupon: ${doc.coupon}, Total: ${doc.total}, Discount: ${doc.discount}, TotalAfterDiscount: ${doc.totalAfterDiscount}`;

    await addDocument(`${doc._id}`, content, {
      type: "cart",
      cartId: doc._id,
      userId: doc.user,
    });
    console.log(`RAG embeddings updated for cart ${doc._id}`);
  } catch (err) {
    console.error("RAG auto-train error for Cart (save):", err.message);
  }
});

// After findOneAndUpdate
cartSchema.post("findOneAndUpdate", async function (doc) {
  if (!doc) return;
  try {
    const itemsContent = doc.items.map(
      (i) => `Product: ${i.product}, Qty: ${i.quantity}, Variant: ${JSON.stringify(i.variant)}, Price: ${i.price}`
    ).join(" | ");

    const content = `Cart for user: ${doc.user}, Items: ${itemsContent}, Coupon: ${doc.coupon}, Total: ${doc.total}, Discount: ${doc.discount}, TotalAfterDiscount: ${doc.totalAfterDiscount}`;

    await addDocument(`${doc._id}`, content, {
      type: "cart",
      cartId: doc._id,
      userId: doc.user,
    });
    console.log(`RAG embeddings updated for cart ${doc._id} (update)`);
  } catch (err) {
    console.error("RAG auto-train error for Cart (update):", err.message);
  }
});

// After remove
cartSchema.post("remove", async function (doc) {
  try {
    await Embedding.deleteMany({ docId: `${doc._id}`, docType: "cart" });
    console.log(`Deleted RAG embeddings for removed cart ${doc._id}`);
  } catch (err) {
    console.error("RAG auto-train error for Cart (remove):", err.message);
  }
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
