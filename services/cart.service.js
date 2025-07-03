import Cart from "../models/cartModel.js";

/**
 * Create or update a user's cart.
 *
 * @param {string} userId - ID of the user
 * @param {Object} cartData - Data to create or update the cart
 * @returns {Promise<Object>} - The created or updated cart
 */
const createOrUpdateCart = async (userId, cartData) => {
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $set: cartData },
    { new: true, upsert: true }
  );
  return cart;
};

/**
 * Get a cart by user ID.
 *
 * @param {string} userId - ID of the user
 * @returns {Promise<Object>} - The user's cart
 */
const getCartByUserId = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  return cart;
};

/**
 * Update a cart by user ID.
 *
 * @param {string} userId - ID of the user
 * @param {Object} updateData - Data to update in the cart
 * @returns {Promise<Object>} - The updated cart
 */
const updateCart = async (userId, updateData) => {
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $set: updateData },
    { new: true }
  );
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
 *
 * @param {string} userId - ID of the user
 * @param {Object} itemData - Item data { productId, quantity }
 * @returns {Promise<Object>} - The updated cart
 */
const addItemToCart = async (userId, itemData) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    // If no cart exists, create one with the item
    const newCart = new Cart({
      user: userId,
      items: [{ product: itemData.productId, quantity: itemData.quantity }],
    });
    await newCart.save();
    return newCart;
  }

  // If cart exists, check if item already exists
  const existingItem = cart.items.find(
    (item) => item.product.toString() === itemData.productId
  );

  if (existingItem) {
    // Update quantity
    existingItem.quantity += itemData.quantity;
  } else {
    // Add new item
    cart.items.push({ product: itemData.productId, quantity: itemData.quantity });
  }

  await cart.save();
  return cart;
};

/**
 * Remove an item from the user's cart.
 *
 * @param {string} userId - ID of the user
 * @param {string} productId - ID of the product to remove
 * @returns {Promise<Object>} - The updated cart
 */
const removeItemFromCart = async (userId, productId) => {
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $pull: { items: { product: productId } } },
    { new: true }
  );
  return cart;
};

export default {
  createOrUpdateCart,
  getCartByUserId,
  updateCart,
  deleteCart,
  addItemToCart,
  removeItemFromCart,
};
