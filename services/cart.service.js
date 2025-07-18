import mongoose from "mongoose";
import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import CouponService from "./coupon.service.js";
import User from "../models/userModel.js"; // added user model
import AppErrors from "../utils/app.errors.js";
import StatusCodes from "../utils/status.codes.js";

/**
 * Validate a coupon by ID with realistic business rules.
 */
const validateCoupon = async (couponId, cart, userId, session = null) => {
  const coupon = await CouponService.getCouponById(couponId, session);

  if (!coupon) throw new AppErrors("Coupon not found", StatusCodes.NOT_FOUND);
  if (!coupon.isActive)
    throw new AppErrors("Coupon is not active", StatusCodes.BAD_REQUEST);

  const now = new Date();
  if (coupon.expiryDate && coupon.expiryDate < now)
    throw new AppErrors("Coupon has expired", StatusCodes.BAD_REQUEST);

  if (coupon.minimumAmount && cart.total < coupon.minimumAmount)
    throw new AppErrors(
      `Minimum cart total of ${coupon.minimumAmount} required.`,
      StatusCodes.BAD_REQUEST
    );

  const hasUserUsedCoupon = await CouponService.hasUserUsedCoupon(
    couponId,
    userId
  );
  if (hasUserUsedCoupon)
    throw new AppErrors(
      "You have already used this coupon.",
      StatusCodes.BAD_REQUEST
    );

  // If coupon applies to a specific product or category
  if (coupon.product) {
    const eligible = cart.items.some(
      (item) => item.product._id.toString() === coupon.product.toString()
    );
    if (!eligible)
      throw new AppErrors(
        "Coupon not applicable to products in cart",
        StatusCodes.BAD_REQUEST
      );
  }

  if (coupon.category) {
    const eligible = cart.items.some(
      (item) =>
        item.product.category &&
        item.product.category.toString() === coupon.category.toString()
    );
    if (!eligible)
      throw new AppErrors(
        "Coupon not applicable to this category",
        StatusCodes.BAD_REQUEST
      );
  }

  return coupon;
};

/**
 * Create or update a user's cart with full variant, stock, and discount calculations.
 */

/**
 * Utility: Calculate final price for a product with optional variant.
 * @param {Object} product - Product document
 * @param {Object} variantInput - { name, value, quantity }
 * @param {Date} now - Current date
 * @returns {Object} { finalPrice, sku }
 */
export const getFinalProductPrice = (
  product,
  variantInput = {}, // default to empty object for safety
  now = new Date()
) => {
  let finalPrice = product.basePrice;

  // Check discount validity
  if (
    product.discountPrice &&
    product.discountStart &&
    product.discountEnd &&
    product.discountStart <= now &&
    product.discountEnd >= now
  ) {
    finalPrice = product.discountPrice;
  }

  // Handle variant logic if product has variants
  if (product.variants && product.variants.length > 0) {
    // Ensure variantInput provided
    if (!variantInput.name || !variantInput.value) {
      throw AppErrors.badRequest(
        `Variant selection required for product ${product.name}`
      );
    }

    const variant = product.variants.find(
      (v) => v.name === variantInput.name && !v.isDeleted
    );
    if (!variant)
      throw AppErrors.badRequest(
        `Variant ${variantInput.name} not found for product ${product.name}`
      );

    const option = variant.options.find((o) => o.value === variantInput.value);
    if (!option)
      throw AppErrors.badRequest(
        `Option ${variantInput.value} not available for variant ${variant.name} of ${product.name}`
      );

    // Check option stock availability
    if (option.stock !== undefined && variantInput.quantity > option.stock)
      throw AppErrors.badRequest(
        `Not enough stock for ${variant.name} option ${option.value} of ${product.name}`
      );

    finalPrice += option.priceModifier || 0;

    return { finalPrice, sku: option.sku || null };
  }

  // Check base product stock
  if (product.stock !== undefined && variantInput.quantity > product.stock)
    throw AppErrors.badRequest(`Not enough stock for product ${product.name}`);

  return { finalPrice, sku: product.sku || null };
};

/**
 * Helper: Calculate total of cart items.
 * @param {Array} items - Cart items array
 * @returns {Number} total
 */
export const calculateCartTotal = (items) => {
  return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
};

/**
 * Create or update a user's cart with full variant, stock, and discount calculations.
 * @param {String} userId - User ID
 * @param {Object} cartData - Cart data
 * @returns {Object} - Updated cart
 * @throws {AppErrors} - Throws error if product or variant is not found, or if stock is insufficient
 * @description This function creates a new cart or updates an existing cart for the user.
 * It handles product variants, calculates final prices, and applies any applicable discounts.
 */
const createOrUpdateCart = async (userId, cartData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, coupon } = cartData;

    let cart = await Cart.findOne({ user: userId }).session(session);
    if (!cart) cart = new Cart({ user: userId, items: [] });

    if (items && items.length > 0) {
      const productIds = items.map((i) => i.product);
      const products = await Product.find({ _id: { $in: productIds } })
        .session(session)
        .lean();

      const now = new Date();
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      for (const item of items) {
        const product = productMap.get(item.product.toString());
        if (!product)
          throw AppErrors.notFound(`Product with id ${item.product} not found`);

        if (product.isDeleted)
          throw AppErrors.badRequest(`Product ${product.name} is deleted`);

        const { finalPrice, sku } = getFinalProductPrice(
          product,
          { ...item.variant, quantity: item.quantity },
          now
        );

        item.price = finalPrice;
        if (sku) item.sku = sku;
      }

      cart.items = items;
    }

    cart.total = calculateCartTotal(cart.items);

    // ============ Coupon logic (commented for dev/test) ============
    if (coupon) {
      const validCoupon = await validateCoupon(coupon, cart, userId, session);
      cart.coupon = validCoupon._id;

      if (validCoupon.amount) {
        cart.discount = validCoupon.amount;
      } else if (validCoupon.percentage) {
        cart.discount = cart.total * (validCoupon.percentage / 100);
        if (validCoupon.maxDiscount && cart.discount > validCoupon.maxDiscount) {
          cart.discount = validCoupon.maxDiscount;
        }
      } else {
        cart.discount = 0;
      }

      cart.totalAfterDiscount = cart.total - cart.discount;
    } else {
      cart.coupon = null;
      cart.discount = 0;
      cart.totalAfterDiscount = cart.total;
    }
    cart.coupon = null;
    cart.discount = 0;
    cart.totalAfterDiscount = cart.total;

    if (cart.totalAfterDiscount < 0) cart.totalAfterDiscount = 0;

    await cart.save({ session });
    await session.commitTransaction();
    session.endSession();

    await cart.populate("items.product");

    return cart;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};


/**
 * Update a cart by user ID.
 * @param {String} userId - User ID
 * @param {Object} updateData - Data to update the cart 
 */
// handling stock quantitiy and not recommend 
export const updateCart = async (userId, cartData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, coupon } = cartData;

    // "" Fetch existing cart
    let cart = await Cart.findOne({ user: userId, isDeleted: false }).session(session);
    if (!cart) throw AppErrors.notFound("Cart not found for this user");

    // "" Prepare product data for validation & price calculation
    const productIds = items.map(i => i.product);
    const products = await Product.find({ _id: { $in: productIds }, isDeleted: false })
      .session(session)
      .lean();
    const productMap = new Map(products.map(p => [p._id.toString(), p]));
    const now = new Date();

    for (const incomingItem of items) {
      const product = productMap.get(incomingItem.product.toString());
      if (!product) throw AppErrors.notFound(`Product with id ${incomingItem.product} not found`);
      if (product.isDeleted) throw AppErrors.badRequest(`Product ${product.name} is deleted`);

      // "" Calculate base or discount price
      let price = product.basePrice;
      if (product.discountPrice > 0 && product.discountStart && product.discountEnd) {
        if (now >= product.discountStart && now <= product.discountEnd) {
          price = product.discountPrice;
        }
      }

      // "" Variant price modifier and stock validation
      let variantModifier = 0;
      let variantSku = null;

      const variantName = incomingItem.variant.name;
      const variantValue = incomingItem.variant.value;
      if (incomingItem.variant) {

        const variant = product.variants.find(v => v.name === variantName && !v.isDeleted);
        if (!variant) throw AppErrors.badRequest(`Variant ${variantName} not found for ${product.name}`);

        const option = variant.options.find(o => o.value === variantValue);
        if (!option) throw AppErrors.badRequest(`Option ${variantValue} not found in variant ${variantName} for ${product.name}`);

        variantModifier = option.priceModifier || 0;
        variantSku = option.sku || null;

        // "" Stock check for variant option if stock is defined
        if (option.stock !== undefined && option.stock < incomingItem.quantity) {
          throw AppErrors.badRequest(`Insufficient stock for ${product.name} - ${variantName}: ${variantValue}`);
        }
      }

      const finalPrice = price + variantModifier;

      // "" Check if same variant combination exists in cart
      const existingItemIndex = cart.items.findIndex(cartItem => {
        if (cartItem.product.toString() !== incomingItem.product.toString()) return false;

        const cartVariant = cartItem.variant || {};
        const incomingVariant = incomingItem.variant || {};
        return cartVariant.name === incomingVariant.name && cartVariant.value === incomingVariant.value;
      });

      console.log(incomingItem.quantity)
      if (existingItemIndex >= 0) {
        // "" Update existing item quantity and fields
        cart.items[existingItemIndex].quantity = incomingItem.quantity;
        cart.items[existingItemIndex].price = finalPrice;
        cart.items[existingItemIndex].variant = incomingItem.variant;
      } else {
        // "" Add as new item
        cart.items.push({
          product: incomingItem.product,
          quantity: incomingItem.quantity,
          variant: incomingItem.variant,
          price: finalPrice,
          sku: variantSku
        });
      }

      // "" Reduce variant option stock immediately (if your business logic reserves it)
      // Uncomment if needed:
      console.log(incomingItem.quantity)
      if (incomingItem.variant) {
        await Product.updateOne(
          { _id: product._id, "variants.name": variantName, "variants.options.value": variantValue },
          { $inc: { "variants.$[v].options.$[o].stock": -incomingItem.quantity } },
          {
            arrayFilters: [
              { "v.name": variantName },
              { "o.value": variantValue }
            ],
            session
          }
        );
      }
    }

    // "" Recalculate cart total
    cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // "" Coupon logic with usage update
    if (coupon) {
      const validCoupon = await CouponService.getCouponById(coupon, session);
      if (!validCoupon) throw AppErrors.notFound("Coupon not found");
      if (!validCoupon.isActive) throw AppErrors.badRequest("Coupon is not active");
      if (validCoupon.expiryDate && validCoupon.expiryDate < now)
        throw AppErrors.badRequest("Coupon has expired");
      if (validCoupon.minimumAmount && cart.total < validCoupon.minimumAmount)
        throw AppErrors.badRequest(`Minimum cart total of ${validCoupon.minimumAmount} required`);

      cart.coupon = validCoupon._id;

      if (validCoupon.amount) {
        cart.discount = validCoupon.amount;
      } else if (validCoupon.percentage) {
        cart.discount = cart.total * (validCoupon.percentage / 100);
        if (validCoupon.maxDiscount && cart.discount > validCoupon.maxDiscount) {
          cart.discount = validCoupon.maxDiscount;
        }
      } else {
        cart.discount = 0;
      }

      // "" Increment coupon usage count if your business logic requires
      if (validCoupon.usageCount !== undefined) {
        validCoupon.usageCount += 1;
        await validCoupon.save({ session });
      }
    } else {
      cart.coupon = null;
      cart.discount = 0;
    }

    // "" Calculate totalAfterDiscount
    cart.totalAfterDiscount = cart.total - cart.discount;
    if (cart.totalAfterDiscount < 0) cart.totalAfterDiscount = 0;

    await cart.save({ session });
    await session.commitTransaction();
    session.endSession();

    await cart.populate({
      path: "items.product",
      select: "name images basePrice discountPrice category brand",
      populate: [
        { path: "category", select: "name" },
      ]
    });

    return cart;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
/**
 * Get a cart by user ID.
 */
const getCartByUserId = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    populate: [
      { path: "category", select: "name" },
      { path: "store", select: "name" }
    ],
  });

  if (!cart) throw AppErrors.notFound("Cart not found for this user");

  return cart;
};

/**
 * Delete a cart by user ID.
 */
export const deleteCart = async (userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // "" Fetch cart with related items and coupon
    const cart = await Cart.findOne({ user: userId, isDeleted: false })
      .populate("items.product")
      .populate("coupon")
      .session(session);

    if (!cart) {
      throw AppErrors.notFound("No active cart found for this user to delete");
    }

    // =========================
    // "" Handle product stock reversal if your system reserves stock on cart addition
    // =========================
    for (const item of cart.items) {
      const product = item.product;

      if (product && product.stock !== undefined) {
        product.stock += item.quantity;

        // "" Handle variant stock reversal if applicable
        if (item.variant && product.variants && product.variants.length > 0) {
          for (const variant of product.variants) {
            if (variant.options && variant.options.length > 0) {
              for (const option of variant.options) {
                const variantKey = Object.keys(item.variant)[0];
                const variantValue = item.variant[variantKey];

                if (option.value === variantValue) {
                  option.stock += item.quantity;
                }
              }
            }
          }
        }

        await product.save({ session });
      }
    }

    // =========================
    // "" Coupon usage reversal
    // =========================
    // for dev
    if (cart.coupon) {
      const coupon = cart.coupon;

      if (coupon.usageCount !== undefined) {
        coupon.usageCount -= 1;
        if (coupon.usageCount < 0) coupon.usageCount = 0;

        await coupon.save({ session });
      }
    }

    // =========================
    // "" Soft delete the cart
    // =========================
    cart.isDeleted = true;
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { success: true, message: "Cart soft deleted successfully" };

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Add an item to the user's cart.
 */
const addItemToCart = async (userId, itemData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (itemData.quantity <= 0)
      throw AppErrors.badRequest("Quantity must be greater than zero");

    const product = await Product.findById(itemData.productId).session(session);
    if (!product || product.isDeleted)
      throw AppErrors.notFound("Product not found or not available for sale");

    // Calculate final price and validate variant and stock using your util
    const { finalPrice, sku } = getFinalProductPrice(
      product,
      { ...itemData.variant, quantity: itemData.quantity },
      new Date()
    );

    let cart = await Cart.findOne({ user: userId }).session(session);
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === itemData.productId &&
        JSON.stringify(item.variant || {}) ===
          JSON.stringify(itemData.variant || {})
    );

    if (existingItem) {
      existingItem.quantity += itemData.quantity;
      existingItem.price = finalPrice;
      if (sku) existingItem.sku = sku;
    } else {
      cart.items.push({
        product: itemData.productId,
        quantity: itemData.quantity,
        variant: itemData.variant || undefined,
        price: finalPrice,
      });
    }

    // Recalculate total using your utility
    cart.total = calculateCartTotal(cart.items);

    // Handle coupon recalculation if cart has a valid coupon (optional logic here)
    if (cart.coupon) {
      // Implement coupon recalculation logic if needed
    } else {
      cart.discount = 0;
      cart.totalAfterDiscount = cart.total;
    }

    await cart.save({ session });
    await session.commitTransaction();
    session.endSession();

    return cart;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Remove an item from the user's cart.
 */
const removeItemFromCart = async (userId, itemData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, variant } = itemData;

    const cart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .session(session);

    if (!cart) throw AppErrors.notFound("Cart not found for this user");

    // Find item index matching productId and variant (if any)
    const itemIndex = cart.items.findIndex((item) =>
      item.product._id.toString() === productId &&
      JSON.stringify(item.variant || {}) === JSON.stringify(variant || {})
    );

    if (itemIndex === -1)
      throw AppErrors.badRequest("Product with specified variant not found in cart");

    // Remove item from cart
    cart.items.splice(itemIndex, 1);

    // Recalculate total using your utility
    cart.total = calculateCartTotal(cart.items);

    // Recalculate discount and totalAfterDiscount if a coupon exists
    if (cart.coupon) {
      const validCoupon = await CouponService.getCouponById(cart.coupon, session);
      if (validCoupon) {
        if (validCoupon.amount) cart.discount = validCoupon.amount;
        else if (validCoupon.percentage) {
          cart.discount = cart.total * (validCoupon.percentage / 100);
          if (validCoupon.maxDiscount && cart.discount > validCoupon.maxDiscount) {
            cart.discount = validCoupon.maxDiscount;
          }
        } else {
          cart.discount = 0;
        }
        cart.totalAfterDiscount = cart.total - cart.discount;
      }
    } else {
      cart.discount = 0;
      cart.totalAfterDiscount = cart.total;
    }

    // Ensure no negative totalAfterDiscount
    if (cart.totalAfterDiscount < 0) cart.totalAfterDiscount = 0;

    await cart.save({ session });
    await session.commitTransaction();
    session.endSession();

    return cart;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Get all carts in the system.
 */
const getAllCarts = async (page = 1, limit = 20) => {
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const [carts, total] = await Promise.all([
      Cart.find()
        .skip(skip)
        .limit(limit)
        .populate({
          path: "user",
          select: "name email role",
        })
        .populate({
          path: "items.product",
          select: "name basePrice discountPrice category brand",
          populate: [
            { path: "category", select: "name" },
            { path: "brand", select: "name" },
          ],
        })
        .lean(),
      Cart.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      carts,
      total,
      totalPages,
      currentPage: page,
    }
}
export default {
  createOrUpdateCart,
  updateCart,
  getCartByUserId,
  deleteCart,
  addItemToCart,
  removeItemFromCart,
  getAllCarts,
};
