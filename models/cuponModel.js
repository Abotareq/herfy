import mongoose from "mongoose";
import { addDocument } from "../rag/vectorStore.js";
import Embedding from "./Embedding.js";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["fixed", "percentage"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minCartTotal: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: null,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // Optional vendor reference
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// -------------------- Auto Incremental RAG Training -------------------- //

// After create/update
couponSchema.post("save", async function (doc) {
  try {
    const content = `Coupon Code: ${doc.code}, Type: ${doc.type}, Value: ${
      doc.value
    }, MinCartTotal: ${doc.minCartTotal}, MaxDiscount: ${
      doc.maxDiscount
    }, Expiry: ${doc.expiryDate}, UsageLimit: ${doc.usageLimit}, UsedCount: ${
      doc.usedCount
    }, Active: ${doc.active}, Deleted: ${doc.isDeleted}, Vendor: ${
      doc.vendor || "None"
    }`;

    await addDocument(`${doc._id}`, content, {
      type: "coupon",
      couponId: doc._id,
      code: doc.code,
      vendorId: doc.vendor || null,
    });
    console.log(`RAG embeddings updated for coupon ${doc._id}`);
  } catch (err) {
    console.error("RAG auto-train error for Coupon:", err.message);
  }
});

// After findOneAndUpdate
couponSchema.post("findOneAndUpdate", async function (doc) {
  if (!doc) return;
  try {
    const content = `Coupon Code: ${doc.code}, Type: ${doc.type}, Value: ${
      doc.value
    }, MinCartTotal: ${doc.minCartTotal}, MaxDiscount: ${
      doc.maxDiscount
    }, Expiry: ${doc.expiryDate}, UsageLimit: ${doc.usageLimit}, UsedCount: ${
      doc.usedCount
    }, Active: ${doc.active}, Deleted: ${doc.isDeleted}, Vendor: ${
      doc.vendor || "None"
    }`;

    await addDocument(`${doc._id}`, content, {
      type: "coupon",
      couponId: doc._id,
      code: doc.code,
      vendorId: doc.vendor || null,
    });
    console.log(`RAG embeddings updated for coupon ${doc._id} (update)`);
  } catch (err) {
    console.error(" RAG auto-train error for Coupon (update):", err.message);
  }
});

// After remove
couponSchema.post("remove", async function (doc) {
  try {
    await Embedding.deleteMany({ docId: `${doc._id}`, docType: "coupon" });
    console.log(`Deleted RAG embeddings for removed coupon ${doc._id}`);
  } catch (err) {
    console.error(" RAG auto-train error for Coupon (remove):", err.message);
  }
});

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
