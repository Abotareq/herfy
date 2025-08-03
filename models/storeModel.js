import mongoose from 'mongoose';
import slugify from 'slugify';

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

  // Slug => clean SEO URL from name
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

  //store related modles 
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

const Store = mongoose.model('Store', storeSchema);
export default Store;
