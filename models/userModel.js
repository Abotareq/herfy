// {
//   "name": "Osama Saad",
//   "email": "osama@gmail.com",
//   "password": "123456",
//   "phone": "01000000000",
//   "role": "vendor",
//   "addresses": [
//     {
//       "buildingNo": 4,
//       "street": "Al Shohadaa",
//       "nearestLandMark": "School",
//       "city": "Juhayna",
//       "governorate": "Sohag",
//       "country": "Egypt",
//       "addressType": "home",
//       "isDefault": true
//     }
//   ],
//   "wishlist": []
// }

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import userRole from "../utils/user.role.js";
import { addDocument } from "../rag/vectorStore.js";
import Embedding from "./Embedding.js";
// A sub-document for addresses
const addressSchema = new mongoose.Schema({
  buildingNo: { type: Number, required: true }, // 4
  street: { type: String, required: true }, // Al Shohadaa
  postalCode: { type: Number, required: false }, //12345
  nearestLandMark: { type: String, required: false }, //school
  city: { type: String, required: true }, // Juhayna
  governorate: { type: String, required: true }, // sohag
  country: { type: String, required: true, default: "Egypt" },
  addressType: {
    type: String,
    enum: ["home", "work"],
    required: true,
  }, // (home -work)
  isDefault: { type: Boolean, default: false }, //(to handle many addresses)
});

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      minlength: 6,
      required: function () {
        return !this.googleId;
      },
    },
    phone: {
      type: String,
      unique: true,
      trim: true,
      required: function () {
        return !this.googleId;
      },
    },
    role: {
      type: String,
      enum: [userRole.ADMIN, userRole.CUSTOMER, userRole.VENDOR],
      default: userRole.CUSTOMER,
    },
    googleId: { type: String, unique: true, sparse: true },
    addresses: [addressSchema],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    storesCount: { type: Number, default: 0 }, // to track how many stores the user has
    // for create order
    ordersCount: { type: Number, default: 0 }, // to track how many orders the user has
    cancelledOrders: { type: Number, default: 0 }, // to track how many orders the user has cancelled
    activeOrders: { type: Number, default: 0 }, // to track how many active orders the user has
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);
// userSchema.index({ email: 1 }, { unique: true });
// userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
/* userSchema.index({ email: 1 });
userSchema.index({ phone: 1 }); */

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// -------------------- Auto Incremental RAG Training Hooks -------------------- //

// After creating or updating a user
userSchema.post("save", async function (doc) {
  try {
    const content = `User: ${doc.userName}, Name: ${doc.firstName} ${
      doc.lastName
    }, Email: ${doc.email}, Phone: ${doc.phone}, Role: ${
      doc.role
    }, Addresses: ${JSON.stringify(
      doc.addresses
    )}, Wishlist: ${doc.wishlist.join(", ")}`;
    await addDocument(`${doc._id}`, content, { type: "user", userId: doc._id });
    console.log(`RAG embeddings updated for user ${doc._id}`);
  } catch (err) {
    console.error("RAG auto-train error for User:", err.message);
  }
});

// After findOneAndUpdate
userSchema.post("findOneAndUpdate", async function (doc) {
  if (!doc) return;
  try {
    const content = `User: ${doc.userName}, Name: ${doc.firstName} ${
      doc.lastName
    }, Email: ${doc.email}, Phone: ${doc.phone}, Role: ${
      doc.role
    }, Addresses: ${JSON.stringify(
      doc.addresses
    )}, Wishlist: ${doc.wishlist.join(", ")}`;
    await addDocument(`${doc._id}`, content, { type: "user", userId: doc._id });
    console.log(`RAG embeddings updated for user ${doc._id} (update)`);
  } catch (err) {
    console.error(" RAG auto-train error for User (update):", err.message);
  }
});

// After removing a user: delete related embeddings
userSchema.post("remove", async function (doc) {
  try {
    await Embedding.deleteMany({ docId: `${doc._id}`, docType: "user" });
    console.log(`Deleted RAG embeddings for removed user ${doc._id}`);
  } catch (err) {
    console.error("RAG auto-train error for User (remove):", err.message);
  }
});
const User = mongoose.model("User", userSchema);
export default User;
