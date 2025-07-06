import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import CouponService from "./coupon.service.js"; // adjust path as per your structure
import AppErrors from "../utils/app.errors.js";
import StatusCodes from "../utils/status.codes.js";

/**
 * Helper: Calculate total of the cart items.
 * @param {Array} items - Array of cart items populated with product details
 * @returns {number} - Total price of all items
 */
const calculateCartTotal = (items) => {
  let total = 0;
  for (const item of items) {
    if (item.product && item.product.price) {
      total += item.product.price * item.quantity;
    }
  }
  return total;
};

/**
 * Validate a coupon by ID with all realistic business rules.
 * @param {string} couponId - The ID of the coupon to validate.
 * @param {Object} cart - The user's cart object (to check total, items, etc.).
 * @param {string} userId - The ID of the current user.
 * @returns {Promise<Object>} - Returns the valid coupon document.
 * @throws {AppErrors} - Throws error if invalid, expired, or used.
 */
const validateCoupon = async (couponId, cart, userId) => {
  const coupon = await CouponService.getCouponById(couponId);

  if (!coupon) {
    throw new AppErrors("Coupon not found", StatusCodes.NOT_FOUND);
  }

  if (!coupon.isActive) {
    throw new AppErrors("Coupon is not active", StatusCodes.BAD_REQUEST);
  }

  const now = new Date();
  if (coupon.expiryDate && coupon.expiryDate < now) {
    throw new AppErrors("Coupon has expired", StatusCodes.BAD_REQUEST);
  }

  if (coupon.minimumAmount && cart.total < coupon.minimumAmount) {
    throw new AppErrors(
      `Minimum cart total of ${coupon.minimumAmount} required to use this coupon.`,
      StatusCodes.BAD_REQUEST
    );
  }

  const hasUserUsedCoupon = await CouponService.hasUserUsedCoupon(
    couponId,
    userId
  );
  if (hasUserUsedCoupon) {
    throw new AppErrors(
      "You have already used this coupon.",
      StatusCodes.BAD_REQUEST
    );
  }

  return coupon;
};

/**
 * Create or update a user's cart.
 * Creates new cart if not exists, updates items and coupon, recalculates total.
 *
 * @param {string} userId - ID of the user
 * @param {Object} cartData - Data to create or update the cart
 * @param {Array} [cartData.items] - Array of cart items
 * @param {string} [cartData.coupon] - Coupon ID to apply
 * @returns {Promise<Object>} - The created or updated cart document
 */
const createOrUpdateCart = async (userId, cartData) => {
  const { items, coupon } = cartData;
  const updateData = {};

  if (items) {
    updateData.items = items;
  }

  let cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart) {
    cart = new Cart({ user: userId, items: items || [] });
  } else if (items) {
    cart.items = items;
  }

  cart.total = calculateCartTotal(cart.items);

  if (coupon) {
    const validCoupon = await validateCoupon(coupon, cart, userId);
    cart.coupon = validCoupon._id;

    if (validCoupon.amount) {
      cart.discount = validCoupon.amount;
    } else if (validCoupon.percentage) {
      cart.discount = cart.total * (validCoupon.percentage / 100);
    } else {
      cart.discount = 0;
    }

    cart.totalAfterDiscount = cart.total - cart.discount;
  } else {
    cart.coupon = null;
    cart.discount = 0;
    cart.totalAfterDiscount = cart.total;
  }

  await cart.save();
  return cart;
};

/**
 * Update a cart by user ID.
 * Updates coupon, recalculates discount and totalAfterDiscount.
 *
 * @param {string} userId - ID of the user
 * @param {Object} updateData - Data to update in the cart
 * @param {string} [updateData.coupon] - Coupon ID to apply
 * @returns {Promise<Object>} - The updated cart document
 * @throws {AppErrors} - If cart not found
 */
const updateCart = async (userId, updateData) => {
  let cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart) {
    throw AppErrors.notFound("Cart not found");
  }

  cart.total = calculateCartTotal(cart.items);

  if (updateData.coupon) {
    const validCoupon = await validateCoupon(updateData.coupon, cart, userId);
    cart.coupon = validCoupon._id;

    if (validCoupon.amount) {
      cart.discount = validCoupon.amount;
    } else if (validCoupon.percentage) {
      cart.discount = cart.total * (validCoupon.percentage / 100);
    } else {
      cart.discount = 0;
    }

    cart.totalAfterDiscount = cart.total - cart.discount;
  }

  await cart.save();
  return cart;
};

/**
 * Get a cart by user ID.
 *
 * @param {string} userId - ID of the user
 * @returns {Promise<Object>} - The user's cart populated with items.product
 */
const getCartByUserId = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  return cart;
};

/**
 * Delete a cart by user ID.
 *
 * @param {string} userId - ID of the user
 * @returns {Promise<void>}
 */
const deleteCart = async (userId) => {
  await Cart.findOneAndDelete({ user: userId });
};

/**
 * Add an item to the user's cart.
 * Validates quantity, stock, and variant. Updates total after adding.
 *
 * @param {string} userId - ID of the user
 * @param {Object} itemData - Item data
 * @param {string} itemData.productId - ID of the product
 * @param {number} itemData.quantity - Quantity to add
 * @param {Object} [itemData.variant] - Variant details (e.g., { Color: "Red", Size: "Large" })
 * @returns {Promise<Object>} - The updated cart document
 * @throws {AppErrors} - If product not found, insufficient stock, or invalid quantity
 */
const addItemToCart = async (userId, itemData) => {
  // Validate quantity > 0
  if (itemData.quantity <= 0) {
    throw new AppErrors("Quantity must be greater than zero", 400);
  }

  // Fetch product to validate existence and stock
  const product = await Product.findById(itemData.productId);
  if (!product) {
    throw AppErrors.notFound("Product not found or not available for sale");
  }

  if (product.stock < itemData.quantity) {
    throw new AppErrors("Insufficient stock available", 400);
  }

  // Fetch or create cart
  let cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart) {
    // Create new cart with this item
    cart = new Cart({
      user: userId,
      items: [
        {
          product: itemData.productId,
          quantity: itemData.quantity,
          variant: itemData.variant || undefined,
        },
      ],
    });
  } else {
    // Check if same product and variant exist
    const existingItem = cart.items.find(
      (item) =>
        item.product._id.toString() === itemData.productId &&
        JSON.stringify(item.variant || {}) ===
          JSON.stringify(itemData.variant || {})
    );

    if (existingItem) {
      // Update quantity ensuring stock availability
      const newQuantity = existingItem.quantity + itemData.quantity;
      if (newQuantity > product.stock) {
        throw new AppErrors("Insufficient stock for this quantity", 400);
      }
      existingItem.quantity = newQuantity;
    } else {
      // Push new item with variant
      cart.items.push({
        product: itemData.productId,
        quantity: itemData.quantity,
        variant: itemData.variant || undefined,
      });
    }
  }

  // Recalculate total
  cart.total = calculateCartTotal(cart.items);

  // Recalculate discount if coupon exists
  if (cart.coupon) {
    const validCoupon = await CouponService.getCouponById(cart.coupon);
    if (validCoupon) {
      if (validCoupon.amount) {
        cart.discount = validCoupon.amount;
      } else if (validCoupon.percentage) {
        cart.discount = cart.total * (validCoupon.percentage / 100);
      } else {
        cart.discount = 0;
      }
      cart.totalAfterDiscount = cart.total - cart.discount;
    }
  } else {
    cart.discount = 0;
    cart.totalAfterDiscount = cart.total;
  }

  await cart.save();
  return cart;
};
/**
 * Remove an item from the user's cart.
 * Updates total after removal.
 *
 * @param {string} userId - ID of the user
 * @param {string} productId - ID of the product to remove
 * @returns {Promise<Object>} - The updated cart document
 * @throws {AppErrors} - If product not found in cart
 */
const removeItemFromCart = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart) {
    throw AppErrors.notFound("Cart not found for this user");
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product._id.toString() === productId
  );

  if (itemIndex === -1) {
    throw new AppErrors("Product not found in cart", 400);
  }

  cart.items.splice(itemIndex, 1);

  cart.total = calculateCartTotal(cart.items);

  if (cart.coupon) {
    const validCoupon = await CouponService.getCouponById(cart.coupon);
    if (validCoupon) {
      if (validCoupon.amount) {
        cart.discount = validCoupon.amount;
      } else if (validCoupon.percentage) {
        cart.discount = cart.total * (validCoupon.percentage / 100);
      } else {
        cart.discount = 0;
      }
      cart.totalAfterDiscount = cart.total - cart.discount;
    }
  } else {
    cart.discount = 0;
    cart.totalAfterDiscount = cart.total;
  }

  await cart.save();
  return cart;
};

/**
 * Get all carts in the system.
 * Populates user and items.product details.
 *
 * @returns {Promise<Array>} - Array of all carts with populated user and product details
 */
const getAllCarts = async () => {
  const carts = await Cart.find()
    .populate("user", "name email role")
    .populate("items.product", "name price");
  return carts;
};

export default {
  createOrUpdateCart,
  updateCart,
  getCartByUserId,
  deleteCart,
  addItemToCart,
  removeItemFromCart,
  getAllCarts,
};
