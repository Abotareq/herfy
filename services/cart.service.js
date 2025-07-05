// import Cart from "../models/cartModel.js";

// /**
//  * Create or update a user's cart.
//  *
//  * @param {string} userId - ID of the user
//  * @param {Object} cartData - Data to create or update the cart
//  * @returns {Promise<Object>} - The created or updated cart
//  */
// const createOrUpdateCart = async (userId, cartData) => {
//   const cart = await Cart.findOneAndUpdate(
//     { user: userId },
//     { $set: cartData },
//     { new: true, upsert: true }
//   );
//   return cart;
// };

// /**
//  * Get a cart by user ID.
//  *
//  * @param {string} userId - ID of the user
//  * @returns {Promise<Object>} - The user's cart
//  */
// const getCartByUserId = async (userId) => {
//   const cart = await Cart.findOne({ user: userId }).populate("items.product");
//   return cart;
// };

// /**
//  * Update a cart by user ID.
//  *
//  * @param {string} userId - ID of the user
//  * @param {Object} updateData - Data to update in the cart
//  * @returns {Promise<Object>} - The updated cart
//  */
// const updateCart = async (userId, updateData) => {
//   const cart = await Cart.findOneAndUpdate(
//     { user: userId },
//     { $set: updateData },
//     { new: true }
//   );
//   return cart;
// };

// /**
//  * Delete a cart by user ID.
//  *
//  * @param {string} userId - ID of the user
//  * @returns {Promise<void>}
//  */
// const deleteCart = async (userId) => {
//   await Cart.findOneAndDelete({ user: userId });
// };

// /**
//  * Add an item to the user's cart.
//  *
//  * @param {string} userId - ID of the user
//  * @param {Object} itemData - Item data { productId, quantity }
//  * @returns {Promise<Object>} - The updated cart
//  */
// const addItemToCart = async (userId, itemData) => {
//   const cart = await Cart.findOne({ user: userId });

//   if (!cart) {
//     // If no cart exists, create one with the item
//     const newCart = new Cart({
//       user: userId,
//       items: [{ product: itemData.productId, quantity: itemData.quantity }],
//     });
//     await newCart.save();
//     return newCart;
//   }

//   // If cart exists, check if item already exists
//   const existingItem = cart.items.find(
//     (item) => item.product.toString() === itemData.productId
//   );

//   if (existingItem) {
//     // Update quantity
//     existingItem.quantity += itemData.quantity;
//   } else {
//     // Add new item
//     cart.items.push({ product: itemData.productId, quantity: itemData.quantity });
//   }

//   await cart.save();
//   return cart;
// };

// /**
//  * Remove an item from the user's cart.
//  *
//  * @param {string} userId - ID of the user
//  * @param {string} productId - ID of the product to remove
//  * @returns {Promise<Object>} - The updated cart
//  */
// const removeItemFromCart = async (userId, productId) => {
//   const cart = await Cart.findOneAndUpdate(
//     { user: userId },
//     { $pull: { items: { product: productId } } },
//     { new: true }
//   );
//   return cart;
// };

// export default {
//   createOrUpdateCart,
//   getCartByUserId,
//   updateCart,
//   deleteCart,
//   addItemToCart,
//   removeItemFromCart,
// };

import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js"
// import Coupon from "../modales/coupon.modale.js";
import AppErrors from "../utils/app.errors.js";
import StatusCodes from "../utils/status.codes.js";

// import Coupon from "../models/coupon.model.js";

// /**
//  * Validate a coupon by ID with all realistic business rules.
//  * @param {string} couponId - The ID of the coupon to validate.
//  * @param {Object} cart - The user's cart object (to check total, items, etc.).
//  * @param {string} userId - The ID of the current user.
//  * @returns {Promise<Object>} - Returns the valid coupon document.
//  */
// export const validateCoupon = async (couponId, cart, userId) => {
//   // 1. Check if the coupon exists
//   const coupon = await Coupon.findById(couponId);
//   if (!coupon) {
//     throw new AppErrors("Coupon not found", 404);
//   }

//   // 2. Check if the coupon is active
//   if (!coupon.isActive) {
//     throw new AppErrors("Coupon is not active", 400);
//   }

//   // 3. Check expiry date
//   if (coupon.expiresAt && coupon.expiresAt < Date.now()) {
//     throw new AppErrors("Coupon has expired", 400);
//   }

//   // 4. Check global usage limit
//   if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
//     throw new AppErrors("Coupon usage limit reached", 400);
//   }

//   // 5. Check user-specific usage
//   if (coupon.usedBy && coupon.usedBy.includes(userId)) {
//     throw new AppErrors("You have already used this coupon", 400);
//   }

//   // 6. Check minimum order amount
//   if (coupon.minimumOrderAmount && cart.total < coupon.minimumOrderAmount) {
//     throw new AppErrors(`Minimum order amount to use this coupon is ${coupon.minimumOrderAmount}`, 400);
//   }

//   // 7. Check applicable products (if any)
//   if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
//     const cartProductIds = cart.items.map(item => item.product.toString());
//     const isValid = cartProductIds.some(productId =>
//       coupon.applicableProducts.includes(productId)
//     );
//     if (!isValid) {
//       throw new AppErrors("This coupon does not apply to any product in your cart", 400);
//     }
//   }

//   // 8. Check applicable categories (if any)
//   if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
//     const cartCategories = cart.items.map(item => item.product.category.toString());
//     const isValidCategory = cartCategories.some(categoryId =>
//       coupon.applicableCategories.includes(categoryId)
//     );
//     if (!isValidCategory) {
//       throw new AppErrors("This coupon does not apply to any category in your cart", 400);
//     }
//   }

//   // ✅ All validations passed, return coupon
//   return coupon;
// };
const createOrUpdateCart = async (userId, cartData) => {
    const { items, coupon } = cartData;
    const updateData = {};

    // Add or update items if provided
    if (items) {
        updateData.items = items;
    }
    // Process the coupon if provided
    if (coupon) {
            // const validCoupon = await validateCoupon(cartData.coupon, cart, userId);
            //     cart.coupon = validCoupon._id;
            updateData.coupon = coupon;
    }
    // updateData.coupon = coupon;
    // Create a new cart if it doesn't exist or update the existing cart
    const updatedCart = await Cart.findOneAndUpdate(
        { user: userId },
        { $set: updateData },
        { new: true, upsert: true } // upsert = creates if not exists
    );

    return updatedCart;
};

const updateCart = async (userId, updateData) => {
  // Find the user's cart
    let cart = await Cart.findOne({ user: userId })
                            // .populate("items.product");

    if (!cart) {
        throw new AppErrors("Cart not found", 404);
    }

    // Update general fields (e.g. coupon, notes, etc.)
    if (updateData.coupon) {
        // const validCoupon = await validateCoupon(updateData.coupon, cart, userId);
        // cart.coupon = validCoupon._id;
        cart.coupon =updateData.coupon;
    }
    await cart.save();
    return cart;
};

const getCartByUserId = async (userId) => {
  const cart = await Cart.findOne({ user: userId })
//   .populate("items.product");
  return cart;
};

const deleteCart = async (userId) => {
  await Cart.findOneAndDelete({ user: userId });
};

const addItemToCart = async (userId, itemData) => {
  // 1. Validate quantity
  if (itemData.quantity <= 0) {
    throw new AppErrors("Quantity must be greater than zero", 400);
  }

  // 2. Validate product exists and active
  const product = await Product.findById(itemData.productId);
  if (!product ) {
    throw AppErrors.notFound("Product not found or not available for sale");
  }

  // 3. Check stock availability
  if (product.stock < itemData.quantity) {
    throw new AppErrors("Insufficient stock available", 400);
  }

  // 4. Find user's cart or create new
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({
      user: userId,
      items: [{ product: itemData.productId, quantity: itemData.quantity }],
    });
  } else {
    // 5. Check if product already in cart
    const existingItem = cart.items.find(
      (item) => item.product.toString() === itemData.productId
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + itemData.quantity;

      // Check if combined quantity exceeds stock
      if (newQuantity > product.stock) {
        throw new AppErrors("Insufficient stock for this quantity", 400);
      }

      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        product: itemData.productId,
        quantity: itemData.quantity,
      });
    }
  }

  // 6. Optional: Recalculate cart total
  // cart.total = await calculateCartTotal(cart.items);

  // 7. Save cart
  await cart.save();
  return cart;
};

const removeItemFromCart = async (userId, productId) => {
  // 1. Find the user's cart first
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new AppErrors("Cart not found for this user", 404);
  }

  // 2. Check if the product exists in the cart
  const itemIndex = cart.items.findIndex(
    (item) =>item.product.toString() === productId
  );
  if (itemIndex === -1) {
    throw new AppErrors("Product not found in cart", 400);
  }

  // 3. Remove the product from the items array
  cart.items.splice(itemIndex, 1);

  // 4. Save the updated cart
  await cart.save();

  // 5. Return the updated cart
  return cart;
};

export default {
  createOrUpdateCart,
  updateCart,
  getCartByUserId,
  deleteCart,
  addItemToCart,
  removeItemFromCart,
};