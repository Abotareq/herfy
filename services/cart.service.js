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

  if (!coupon) throw AppErrors.notFound("Coupon not found");
  if (!coupon.active) throw AppErrors.badRequest("Coupon is not active");

  const now = new Date();
  if (coupon.expiryDate && coupon.expiryDate < now)
    throw AppErrors.badRequest("Coupon has expired");

  if (coupon.minCartTotal && cart.total < coupon.minCartTotal)
    throw new AppErrors(
      `Minimum cart total of ${coupon.minCartTotal} required.`,
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
    console.log(items,coupon)
    let cart = await Cart.findOne({ user: userId }).session(session);
    if (!cart) cart = new Cart({ user: userId, items: [] });

    if (items && items.length > 0) {
      const productIds = items.map((i) => i.product);
      const products = await Product.find({ _id: { $in: productIds } })
        .session(session)
        .lean();
      console.log(products);
      const now = new Date();
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      for (const item of items) {
        console.log("item" ,item)
        const product = productMap.get(item.product.toString());
        console.log("product", product)
        if (!product)
          throw AppErrors.notFound(`Product with id ${item.product} not found`);

        if (product.isDeleted)
          throw AppErrors.badRequest(`Product ${product.name} is deleted`);

          const { finalPrice, sku } = getFinalProductPrice(
            product,
            item.variant || [],
            item.quantity,
            new Date()
          );

        item.price = finalPrice;
        if (sku) item.sku = sku;
      }

      cart.items = items;
    }

    cart.total = calculateCartTotal(cart.items);

    // ============ Coupon logic (commented for dev/test) ============
    if (coupon) {
      const validCoupon = await CouponService.getCouponById(coupon, session);
      if (!validCoupon) throw AppErrors.notFound("Coupon not found");
      if (!validCoupon.active)
        throw AppErrors.badRequest("Coupon is not active");
      if (validCoupon.expiryDate && validCoupon.expiryDate < now) {
        throw AppErrors.badRequest("Coupon has expired");
      }
      if (validCoupon.minimumAmount && cart.total < validCoupon.minimumAmount) {
        throw AppErrors.badRequest(
          `Minimum cart total of ${validCoupon.minimumAmount} required`
        );
      }
      if (
        validCoupon.maxUsage &&
        validCoupon.usageCount >= validCoupon.maxUsage
      ) {
        throw AppErrors.badRequest("Coupon usage limit reached");
      }

      // if new coupon applied
      if (
        !cart.coupon ||
        cart.coupon.toString() !== validCoupon._id.toString()
      ) {
        cart.coupon = validCoupon._id;
        // if (validCoupon.usageCount !== undefined) {
        //   validCoupon.usageCount += 1;
        //   await validCoupon.save({ session });
        // }
      }

      // Calculate discount
      if (validCoupon.type === "fixed") {
        cart.discount = Math.min(validCoupon.value, cart.total);
        if (
          validCoupon.maxDiscount &&
          cart.discount > validCoupon.maxDiscount
        ) {
          cart.discount = validCoupon.maxDiscount;
        }
      } else if (validCoupon.type === "percentage") {
        cart.discount = cart.total * (validCoupon.value / 100);
        if (
          validCoupon.maxDiscount &&
          cart.discount > validCoupon.maxDiscount
        ) {
          cart.discount = validCoupon.maxDiscount;
        }
      } else {
        cart.discount = 0;
      }
    } else {
      cart.coupon = null;
      cart.discount = 0;
    }
    cart.totalAfterDiscount = Math.max(0, cart.total - cart.discount);

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

//

const updateCart = async (userId, cartData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, coupon } = cartData;
    const now = new Date();

    let cart = await Cart.findOne({ user: userId, isDeleted: false }).session(
      session
    );
    if (!cart) throw AppErrors.notFound("Cart not found for this user");

    // Get all product IDs
    const productIds = items.map((i) => i.product);
    const products = await Product.find({
      _id: { $in: productIds },
      isDeleted: false,
    })
      .session(session)
      .lean();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const updatedItems = [];

    for (const incomingItem of items) {
      const product = productMap.get(incomingItem.product.toString());
      if (!product)
        throw AppErrors.notFound(`Product ${incomingItem.product} not found`);

      // Base price with discount check
      let price = product.basePrice;
      if (
        product.discountPrice > 0 &&
        product.discountStart &&
        product.discountEnd
      ) {
        if (now >= product.discountStart && now <= product.discountEnd) {
          price = product.discountPrice;
        }
      }

      let variantSku = null;
      let availableStock = product.stock || 0;
      let variantModifier = 0;

      // ✅ Handle array of variants
      if (
        Array.isArray(incomingItem.variant) &&
        incomingItem.variant.length > 0
      ) {
        console.log("Incoming item variants:", incomingItem.variant);
        for (const { name, value } of incomingItem.variant) {
          const variant = product.variants.find(
            (v) => v.name === name && !v.isDeleted
          );
          if (!variant)
            throw AppErrors.badRequest(
              `Variant ${name} not found for ${product.name}`
            );

          const option = variant.options.find((o) => o.value === value);
          if (!option)
            throw AppErrors.badRequest(
              `Option ${value} not found in ${name} for ${product.name}`
            );
          console.log("Variant option:", option);
          variantModifier += option.priceModifier || 0;
          variantSku = option.sku || variantSku;
          if (option.stock !== undefined) {
            console.log("Variant stock:", option.stock);
            availableStock = option.stock;
          }
          if (availableStock < incomingItem.quantity) {
            throw AppErrors.badRequest(
              `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${incomingItem.quantity}`
            );
          }
        }
      }
      const finalPrice = price + variantModifier;

      // Compare variants as arrays
      const existingCartItem = cart.items.find((cartItem) => {
        if (cartItem.product.toString() !== incomingItem.product.toString())
          return false;

        const cartVariants = cartItem.variant || [];
        const incomingVariants = incomingItem.variant || [];

        if (cartVariants.length !== incomingVariants.length) return false;

        return cartVariants.every((cv) =>
          incomingVariants.some(
            (iv) => iv.name === cv.name && iv.value === cv.value
          )
        );
      });

      updatedItems.push({
        product: incomingItem.product,
        quantity: incomingItem.quantity,
        variant: incomingItem.variant || [],
        price: finalPrice,
        sku: variantSku,
      });
    }

    // Update cart
    cart.items = updatedItems;
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Handle coupon
    if (coupon) {
      const validCoupon = await CouponService.getCouponById(coupon, session);
      if (!validCoupon) throw AppErrors.notFound("Coupon not found");
      if (!validCoupon.active)
        throw AppErrors.badRequest("Coupon is not active");
      if (validCoupon.expiryDate && validCoupon.expiryDate < now) {
        throw AppErrors.badRequest("Coupon has expired");
      }
      if (validCoupon.minimumAmount && cart.total < validCoupon.minimumAmount) {
        throw AppErrors.badRequest(
          `Minimum cart total of ${validCoupon.minimumAmount} required`
        );
      }

      cart.coupon = validCoupon._id;

      if (validCoupon.type === "fixed") {
        cart.discount = Math.min(validCoupon.value, cart.total);
      } else if (validCoupon.type === "percentage") {
        cart.discount = cart.total * (validCoupon.value / 100);
      } else {
        cart.discount = 0;
      }

      if (validCoupon.maxDiscount && cart.discount > validCoupon.maxDiscount) {
        cart.discount = validCoupon.maxDiscount;
      }
    } else {
      cart.coupon = null;
      cart.discount = 0;
    }

    cart.totalAfterDiscount = Math.max(0, cart.total - cart.discount);
    cart.updatedAt = new Date();

    await cart.save({ session });
    await session.commitTransaction();

    return cart;
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get a cart by user ID.
 */
const getCartByUserId = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate([
    {
      path: "items.product",
      populate: [
        { path: "category", select: "name" },
        { path: "store", select: "name" },
      ],
    },
    {
      path: "coupon",
      select: "code discount type",
    },
  ]);

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
/**
 * Helper: Calculate final price & validate variants/stock.
 */
export const getFinalProductPrice = (
  product,
  variantInput = [], // array of { name, value }
  quantity = 1,
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

  let sku = null;
  let minStock = Infinity;

  if (product.variants && product.variants.length > 0) {
    if (!Array.isArray(variantInput) || variantInput.length === 0) {
      console.log("No variant selected", variantInput)
      throw AppErrors.badRequest(
        `Variant selection required for product ${product.name}`
      );
    }

    for (const vInput of variantInput) {
      console.log("variant input ", vInput)
      const variant = product.variants.find(
        (v) => v.name === vInput.name && !v.isDeleted
      );
      if (!variant)
        throw AppErrors.badRequest(
          `Variant ${vInput.name} not found for product ${product.name}`
        );

      const option = variant.options.find(
        (o) => o.value === vInput.value && !o.isDeleted
      );
      if (!option)
        throw AppErrors.badRequest(
          `Option ${vInput.value} not available for variant ${variant.name} of ${product.name}`
        );

      // Check stock
      if (option.stock !== undefined) {
        minStock = Math.min(minStock, option.stock);
      }

      finalPrice += option.priceModifier || 0;
      sku = option.sku || sku;
    }

    if (minStock !== Infinity && quantity > minStock) {
      throw AppErrors.badRequest(
        `Not enough stock for product ${product.name} with selected options`
      );
    }
  } else {
    // Base product stock
    if (product.stock !== undefined && quantity > product.stock)
      throw AppErrors.badRequest(
        `Not enough stock for product ${product.name}`
      );
  }

  return { finalPrice, sku };
};

/**
 * Helper: Calculate total of cart items.
 */
export const calculateCartTotal = (items) => {
  return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
};

/**
 * Add item to cart.
 */
export const addItemToCart = async (userId, itemData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (itemData.quantity <= 0) {
      throw AppErrors.badRequest("Quantity must be greater than zero");
    }

    const product = await Product.findById(itemData.product).session(session);
    if (!product || product.isDeleted) {
      throw AppErrors.notFound("Product not found or not available for sale");
    }

    // Helper: deep compare for variant arrays
    function areVariantsEqual(v1 = [], v2 = []) {
      if (v1.length !== v2.length) return false;
      return v1.every((attr1) =>
        v2.some(
          (attr2) => attr1.name === attr2.name && attr1.value === attr2.value
        )
      );
    }

    // Calculate final price and validate variants/stock
    const { finalPrice, sku } = getFinalProductPrice(
      product,
      itemData.variant || [],
      itemData.quantity,
      new Date()
    );

    let cart = await Cart.findOne({ user: userId }).session(session);
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
      });
    }

    // 🔹 Check if item already exists with same product + variant
    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === itemData.product.toString() &&
        areVariantsEqual(item.variant || [], itemData.variant || [])
    );

    if (existingItem) {
      existingItem.quantity += itemData.quantity;
      existingItem.price = finalPrice;
      if (sku) existingItem.sku = sku;
    } else {
      cart.items.push({
        product: itemData.product,
        quantity: itemData.quantity,
        variant: itemData.variant || [],
        price: finalPrice,
        sku: sku || undefined,
      });
    }

    // Recalculate total
    cart.total = calculateCartTotal(cart.items);

    // Coupon logic
    const coupon = cart.coupon;
    if (coupon) {
      const validCoupon = await CouponService.getCouponById(coupon, session);
      if (!validCoupon) throw AppErrors.notFound("Coupon not found");
      if (!validCoupon.active)
        throw AppErrors.badRequest("Coupon is not active");
      if (validCoupon.expiryDate && validCoupon.expiryDate < new Date()) {
        throw AppErrors.badRequest("Coupon has expired");
      }
      if (validCoupon.minimumAmount && cart.total < validCoupon.minimumAmount) {
        throw AppErrors.badRequest(
          `Minimum cart total of ${validCoupon.minimumAmount} required`
        );
      }
      if (
        validCoupon.maxUsage &&
        validCoupon.usageCount >= validCoupon.maxUsage
      ) {
        throw AppErrors.badRequest("Coupon usage limit reached");
      }

      if (
        !cart.coupon ||
        cart.coupon.toString() !== validCoupon._id.toString()
      ) {
        cart.coupon = validCoupon._id;
      }

      if (validCoupon.type === "fixed") {
        cart.discount = Math.min(validCoupon.value, cart.total);
        if (
          validCoupon.maxDiscount &&
          cart.discount > validCoupon.maxDiscount
        ) {
          cart.discount = validCoupon.maxDiscount;
        }
      } else if (validCoupon.type === "percentage") {
        cart.discount = cart.total * (validCoupon.value / 100);
        if (
          validCoupon.maxDiscount &&
          cart.discount > validCoupon.maxDiscount
        ) {
          cart.discount = validCoupon.maxDiscount;
        }
      } else {
        cart.discount = 0;
      }
    } else {
      cart.coupon = null;
      cart.discount = 0;
    }

    cart.totalAfterDiscount = Math.max(0, cart.total - cart.discount);
    cart.updatedAt = new Date();

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
const removeItemFromCart = async (userId, itemId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const cart = await Cart.findOne({ user: userId })
      .populate("items.product")
      .session(session);

    if (!cart) throw AppErrors.notFound("Cart not found for this user");
    console.log("itemid", itemId);
    // Find item index matching productId and variant (if any)
    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId.toString()
    );

    if (itemIndex === -1)
      throw AppErrors.badRequest(
        "Product with specified variant not found in cart"
      );

    // Remove item from cart
    cart.items.splice(itemIndex, 1);

    // Recalculate total using your utility
    cart.total = calculateCartTotal(cart.items);

    // Recalculate discount and totalAfterDiscount if a coupon exists
    const now = new Date();
    const coupon = cart.coupon;
    if (coupon) {
      const validCoupon = await CouponService.getCouponById(coupon, session);
      if (!validCoupon) throw AppErrors.notFound("Coupon not found");
      if (!validCoupon.active)
        throw AppErrors.badRequest("Coupon is not active");
      if (validCoupon.expiryDate && validCoupon.expiryDate < now) {
        throw AppErrors.badRequest("Coupon has expired");
      }
      if (validCoupon.minimumAmount && cart.total < validCoupon.minimumAmount) {
        throw AppErrors.badRequest(
          `Minimum cart total of ${validCoupon.minimumAmount} required`
        );
      }
      if (
        validCoupon.maxUsage &&
        validCoupon.usageCount >= validCoupon.maxUsage
      ) {
        throw AppErrors.badRequest("Coupon usage limit reached");
      }

      // if new coupon applied
      if (
        !cart.coupon ||
        cart.coupon.toString() !== validCoupon._id.toString()
      ) {
        cart.coupon = validCoupon._id;
        // if (validCoupon.usageCount !== undefined) {
        //   validCoupon.usageCount += 1;
        //   await validCoupon.save({ session });
        // }
      }

      // Calculate discount
      if (validCoupon.type === "fixed") {
        cart.discount = Math.min(validCoupon.value, cart.total);
        if (
          validCoupon.maxDiscount &&
          cart.discount > validCoupon.maxDiscount
        ) {
          cart.discount = validCoupon.maxDiscount;
        }
      } else if (validCoupon.type === "percentage") {
        cart.discount = cart.total * (validCoupon.value / 100);
        if (
          validCoupon.maxDiscount &&
          cart.discount > validCoupon.maxDiscount
        ) {
          cart.discount = validCoupon.maxDiscount;
        }
      } else {
        cart.discount = 0;
      }
    } else {
      cart.coupon = null;
      cart.discount = 0;
    }
    cart.totalAfterDiscount = Math.max(0, cart.total - cart.discount);
    cart.updatedAt = new Date();
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
/**
 * Applies filters to the cart query based on the provided query parameters.
 *
 * @param {Object} queryParams - The request query parameters (e.g. from req.query).
 * @returns {Object} MongoDB query filters.
 */
const applyFilters = (queryParams) => {
  const filter = {};

  // Match isDeleted status
  if (queryParams.status === "active") {
    filter.isDeleted = false;
  } else if (queryParams.status === "deleted") {
    filter.isDeleted = true;
  }

  // Search filter
  if (queryParams.search) {
    const searchRegex = new RegExp(queryParams.search, 'i');
    const orConditions = [
      { 'items.variant.name': searchRegex },
      { 'items.variant.value': searchRegex },
      { 'items.sku': searchRegex },
    ];

    // If search is a number, include quantity
    if (!isNaN(queryParams.search)) {
      orConditions.push({ 'items.quantity': Number(queryParams.search) });
    }

    // Match _id as string using $expr
    orConditions.push({
      $expr: {
        $regexMatch: {
          input: { $toString: "$_id" },
          regex: queryParams.search,
          options: "i"
        }
      }
    });

    filter.$or = orConditions;
  }

  return filter;
};

/**
 * Builds the MongoDB sort object based on the given sortBy parameter.
 *
 * @param {string} [sortBy] - Field name to sort by.
 * @returns {Object} MongoDB sort object.
 */
const applySort = (sortBy) => {
  if (!sortBy) return { createdAt: -1 }; // Default to sorting by latest
  return { [sortBy]: -1 }; // Descending order by sortBy field
};

/**
 * Retrieves paginated cart documents with optional filtering and sorting.
 *
 * @param {number} [page=1] - Current page number.
 * @param {number} [limit=20] - Number of results per page.
 * @param {string} [sortBy] - Field to sort results by.
 * @param {Object} [queryParams={}] - Query filters (e.g. user, coupon, isDeleted).
 *
 * @returns {Promise<Object>} Paginated result with carts and metadata.
 */
const getAllCarts = async (page = 1, limit = 20, sortBy, queryParams = {}) => {
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  const filters = applyFilters(queryParams);
  const sortOptions = applySort(sortBy);

  const [carts, total] = await Promise.all([
    Cart.find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate({
        path: "user",
        select: "userName email role",
      })
      .populate({
        path: "items.product",
        select: "name basePrice discountPrice category",
        populate: {
          path: "category",
          select: "name",
        },
      })
      .lean(),

    Cart.countDocuments(filters),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    carts,
    total,
    totalPages,
    currentPage: page,
  };
};

/**
 * Admin: Get a specific cart by ID.
 */
const adminGetCartById = async (cartId) => {
  const cart = await Cart.findById(cartId)
    .populate({
      path: "user",
      select: "userName email role _id",
    })
    .populate({
      path: "items.product",
      select: "name description basePrice discountPrice category ",
      populate: [{ path: "category", select: "name" }],
    })
    .lean();
  console.log(cart);

  if (!cart) throw AppErrors.notFound("Cart not found");

  return cart;
};
/**
 * Admin: Delete a cart by ID.
 */
const adminDeleteCartById = async (cartId) => {
  const cart = await Cart.findById(cartId);
  if (!cart) throw AppErrors.notFound("Cart not found");
  const userId = cart.user;
  deleteCart(userId)
    .then(() => {
      console.log("Cart deleted successfully");
      return { success: true, message: "Cart deleted successfully" };
    })
    .catch((error) => {
      throw error;
    });
};

const adminUpdateCart = async (cartId, updateData) => {
  const cart = await Cart.findById(cartId);
  if (!cart) throw AppErrors.notFound("Cart not found");
  const userId = cart.user;
  const updatedCart = await updateCart(userId, updateData);
  return updatedCart;
};
export default {
  createOrUpdateCart,
  updateCart,
  getCartByUserId,
  deleteCart,
  addItemToCart,
  removeItemFromCart,
  getAllCarts,
  validateCoupon,
  adminGetCartById,
  adminDeleteCartById,
  adminUpdateCart,
};
