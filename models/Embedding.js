import mongoose from "mongoose";

const EmbeddingSchema = new mongoose.Schema(
  {
    docId: { type: String, index: true },
    docType: { type: String, index: true },
    chunkIndex: { type: Number, default: 0, index: true },

    content: { type: String, required: true },
    embedding: {
      type: [Number],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },

    relations: {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
      storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
      categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
      reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
      cartId: { type: mongoose.Schema.Types.ObjectId, ref: "Cart" },
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
    },

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "rag_embeddings" }
);

EmbeddingSchema.index({ docId: 1, chunkIndex: 1 }, { unique: true });
EmbeddingSchema.index({ docType: 1 });
EmbeddingSchema.index({ "relations.productId": 1 });
EmbeddingSchema.index({ "relations.userId": 1 });
EmbeddingSchema.index({ createdAt: -1 });

const Embedding = mongoose.model("Embedding", EmbeddingSchema);
export default Embedding;
