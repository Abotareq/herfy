// {
//   "name": "Handmade Jewelry",
//   "slug": "handmade-jewelry",
//   "parent": "665d1b8fd5e1b2c5d9a66f88",
//   "image": "/images/categories/necklaces.png",
//   "createdAt": "2025-06-29T12:10:00.000Z",
//   "updatedAt": "2025-06-29T12:10:00.000Z"
// }


import mongoose from 'mongoose';
import slugify from 'slugify';
import Embedding from './Embedding.js';
import { addDocument } from '../rag/vectorStore.js';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  slug: String,
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  // Added productCount field
  productCount: {
    type: Number,
    default: 0,
  },
  storesCount: {
    type: Number,
    default: 0, // to track how many stores are associated with this category
  },
  image: {
    type: String,
    }
}, {
  timestamps: true,
});

categorySchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// -------------------- Auto Incremental RAG Training -------------------- //

// After create/save
categorySchema.post("save", async function (doc) {
  try {
    const content = `Category: ${doc.name}, Slug: ${doc.slug}, Parent: ${doc.parent}, ProductCount: ${doc.productCount}, StoresCount: ${doc.storesCount}, Image: ${doc.image}`;
    
    await addDocument(`${doc._id}`, content, {
      type: "category",
      categoryId: doc._id,
      name: doc.name,
      slug: doc.slug,
    });
    console.log(`RAG embeddings updated for category ${doc._id}`);
  } catch (err) {
    console.error("RAG auto-train error for Category (save):", err.message);
  }
});

// After findOneAndUpdate
categorySchema.post("findOneAndUpdate", async function (doc) {
  if (!doc) return;
  try {
    const content = `Category: ${doc.name}, Slug: ${doc.slug}, Parent: ${doc.parent}, ProductCount: ${doc.productCount}, StoresCount: ${doc.storesCount}, Image: ${doc.image}`;
    
    await addDocument(`${doc._id}`, content, {
      type: "category",
      categoryId: doc._id,
      name: doc.name,
      slug: doc.slug,
    });
    console.log(`RAG embeddings updated for category ${doc._id} (update)`);
  } catch (err) {
    console.error("RAG auto-train error for Category (update):", err.message);
  }
});

// After remove
categorySchema.post("remove", async function (doc) {
  try {
    await Embedding.deleteMany({ docId: `${doc._id}`, docType: "category" });
    console.log(`Deleted RAG embeddings for removed category ${doc._id}`);
  } catch (err) {
    console.error("RAG auto-train error for Category (remove):", err.message);
  }
});


const Category = mongoose.model('Category', categorySchema);
export default Category;