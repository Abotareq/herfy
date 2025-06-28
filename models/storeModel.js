// example
// {
//   "owner": "665d1b8fd5e1b2c5d9a66f12",
//   "name": "ZStore",
//   "description": "montagat from sohag",
//   "logoUrl": "/logos/ZStore.png",
//   "location": {
//     "type": "Point",
//     "coordinates": [31.2357, 30.0444]
//   },
//   "policies": {
//     "shipping": "We ship in 2-3 days inside sohag.",
//     "returns": "Returns allowed within 7 days with receipt."
//   }
// }


const mongoose = require('mongoose');
const slugify = require('slugify');

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


  //Slug => to create clean and descriptive web addresses 
  //Without a slug: herafy.net/category/667f2d3b5e4a8c1f9b0e1a2b 
  //With a slug: herafy.net/category/handmade-jewelry 

//   Input: Handmade Jewelry
// Output: handmade-jewelry

  slug: String, 



  description: {
    type: String,
    required: [true, 'Store description is required'],
  },
  logoUrl: String,

  // status => Allows an admin to approve, reject, or suspend a store.
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
  policies: {
    shipping: String,
    returns: String,
  }
}, {
  timestamps: true,
});

// Create store slug from the name
storeSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

const Store = mongoose.model('Store', storeSchema);
module.exports = Store;