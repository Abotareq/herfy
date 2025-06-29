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



import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// A sub-document for addresses
// تفاصيل العنوان كتيرة شوية
const addressSchema = new mongoose.Schema({
  buildingNo: { type: Number, required: true }, // 4
  street: { type: String, required: true },  // Al Shohadaa 
  nearestLandMark: { type: String, required: false },  //school
  city: { type: String, required: true },   // Juhayna
  governorate: { type: String, required: true },  // sohag
  country: { type: String, required: true, default: 'Egypt' },
  addressType: { type: String, required: true },   // (home -work)
  isDefault: { type: Boolean, default: false },    //(to handle many addresses)
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  phone: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['customer', 'vendor', 'admin'],
    default: 'customer',
  },
  addresses: [addressSchema], // Array of address sub-documents
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);
export default User;