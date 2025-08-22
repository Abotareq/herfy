import mongoose from 'mongoose';
import slugify from 'slugify';
import { addDocument } from "../rag/vectorStore.js";
import Embedding from "./Embedding.js";

const storeSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  name: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    unique: true,
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'Store description is required'],
  },
  logoUrl: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere',
    },
  },
  address: {
    city: { type: String, required: [true, 'City is required'] },
    postalCode: { type: Number, required: [true, 'Postal code is required'] },
    street: { type: String, required: [true, 'Street is required'] },
  },
  categorieCount: { type: Number, default: 0 },
  couponsUsed: { type: Number, default: 0 },
  productCount: { type: Number, default: 0 },
  ordersCount: { type: Number, default: 0 },
  policies: {
    shipping: String,
    returns: String,
  },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true,
});

// Generate slug before saving
storeSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// -------------------- Auto Incremental RAG Training Hooks -------------------- //

// After creating or updating a store
storeSchema.post('save', async function(doc) {
  try {
    const content = `Store Name: ${doc.name}, Description: ${doc.description}, Owner: ${doc.owner}, Location: ${JSON.stringify(doc.location)}, Address: ${JSON.stringify(doc.address)}, Products: ${doc.productCount}, Orders: ${doc.ordersCount}`;
    await addDocument(`${doc._id}`, content, { type: 'store', storeId: doc._id });
    console.log(`RAG embeddings updated for store ${doc._id}`);
  } catch (err) {
    console.error('RAG auto-train error for Store:', err.message);
  }
});

// After findOneAndUpdate
storeSchema.post('findOneAndUpdate', async function(doc) {
  if (!doc) return;
  try {
    const content = `Store Name: ${doc.name}, Description: ${doc.description}, Owner: ${doc.owner}, Location: ${JSON.stringify(doc.location)}, Address: ${JSON.stringify(doc.address)}, Products: ${doc.productCount}, Orders: ${doc.ordersCount}`;
    await addDocument(`${doc._id}`, content, { type: 'store', storeId: doc._id });
    console.log(`RAG embeddings updated for store ${doc._id} (update)`);
  } catch (err) {
    console.error('RAG auto-train error for Store (update):', err.message);
  }
});

// After removing a store: delete related embeddings
storeSchema.post('remove', async function(doc) {
  try {
    await Embedding.deleteMany({ docId: `${doc._id}`, docType: 'store' });
    console.log(`🗑️ Deleted RAG embeddings for removed store ${doc._id}`);
  } catch (err) {
    console.error('RAG auto-train error for Store (remove):', err.message);
  }
});

const Store = mongoose.model('Store', storeSchema);
export default Store;
