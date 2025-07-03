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
  image: String,
}, {
  timestamps: true,
});

categorySchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

const Category = mongoose.model('Category', categorySchema);
export default Category;