import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import { Coupon } from "../models/cuponModel.js";
import Order from "../models/orderModel.js";
import Store from "../models/storeModel.js";
import User from "../models/userModel.js";
import AppErrors from "../utils/app.errors.js";
import mongoose from "mongoose";
// filter method
import { buildStoreFilterQuery } from "../utils/filter_method.js";
import slugify from "slugify";
/**
 * Creates a new store document.
 *
 * @param {object} data - The store data to create.
 * @returns {Promise<object>} - The created store document.
 */
const createStore = async (data) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Optional: Ensure user exists first

    // for prod
    const user = await User.findById(data.owner).session(session);
    if (!user) {
      throw AppErrors.notFound("User not found");
    }

    // Optional: Ensure user does not already own a store if your business logic enforces one-store-per-user
    // const existingStore = await Store.findOne({ owner: data.owner }).session(session);
    // if (existingStore) {
    //   throw AppErrors.badRequest('User already owns a store.');
    // }

    // Generate slug from name
    const generatedSlug = slugify(data.name, { lower: true });

    // Check if store with same slug already exists for this owner
    const existingStore = await Store.findOne({
      owner: data.owner,
      slug: generatedSlug,
    }).session(session);

    if (existingStore) {
      throw AppErrors.badRequest(
        "Store with this name already exists for this owner."
      );
    }

    // ✅ Assign slug to data before creating store
    data.slug = generatedSlug;
    if (
      !data.location ||
      !Array.isArray(data.location.coordinates) ||
      data.location.coordinates.length !== 2
    ) {
      throw AppErrors.badRequest("Invalid location coordinates");
    }

    const store = await Store.create(
      [
        {
          owner: data.owner,
          name: data.name,
          description: data.description,
          logoUrl: data.logoUrl,
          location: {
            type: "Point",
            coordinates: data.location.coordinates, // expects [longitude, latitude]
          },
          policies: {
            shipping: data.policies?.shipping,
            returns: data.policies?.returns,
          },
          slug: data.slug, // Ensure slug is set
          isDeleted: false, // Default to not deleted
          // Add any other default fields you need
          ordersCount: 0,
          productCount: 0,
          couponsUsed: 0,
          categorieCount: 0,
        },
      ],
      { session }
    );

    const createdStore = store[0];

    // Add store to user's stores array
    // for prod
    user.storesCount += 1; // Increment user's store count
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return createdStore;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw AppErrors.badRequest(err.message);
  }
};

/**
 * Retrieves all stores with pagination and filters.
 *
 * @param {object} options - Options for retrieval.
 * @param {number} [options.page=1] - Current page number.
 * @param {number} [options.limit=10] - Number of items per page.
 * @param {string} [options.search] - Search string for store name.
 * @param {string} [options.status] - Status filter.
 * @returns {Promise<object>} - An object containing total count and list of stores.
 */
const getAllStores = async ({ page = 1, limit = 10, search, status }) => {
  const query = buildStoreFilterQuery({ search, status });

  // Exclude soft deleted stores
  query.isDeleted = { $ne: true };

  const countPromise = Store.countDocuments(query);
  const storesPromise = Store.find(query)
    .skip((page - 1) * limit)
    .limit(limit);

  const [total, stores] = await Promise.all([countPromise, storesPromise]);

  return {
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    stores,
  };
};

/**
 * Retrieves a store by its ID.
 *
 * @param {string} id - The store ID.
 * @returns {Promise<object>} - The store document.
 * @throws {AppError} - Throws if store is not found.
 */
const getStoreById = async (id) => {
  const store = await Store.findOne({ _id: id, isDeleted: { $ne: true } })
    .lean(); // optional: for performance

  if (!store) {
    throw AppErrors.notFound("Store not found or has been deleted");
  }

  return store;
};

/**
 * Updates a store by its ID.
 *
 * @param {string} id - The store ID.
 * @param {object} data - Data to update.
 * @returns {Promise<object>} - The updated store document.
 * @throws {AppError} - Throws if store is not found.
 */
const updateStore = async (id, data) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find store by ID within transaction
    const store = await Store.findById(id).session(session);
    if (!store) {
      throw AppErrors.notFound("Store not found");
    }

    // If name is being updated, regenerate slug and check uniqueness
    if (data.name) {
      const generatedSlug = slugify(data.name, { lower: true });

      const existingStore = await Store.findOne({
        owner: store.owner,
        slug: generatedSlug,
        _id: { $ne: id }, // exclude current store
      }).session(session);

      if (existingStore) {
        throw AppErrors.badRequest(
          "Another store with this name already exists for this owner."
        );
      }

      store.name = data.name;
      store.slug = generatedSlug;
    }

    // Update other fields if provided
    if (data.description !== undefined) store.description = data.description;
    if (data.logoUrl !== undefined) store.logoUrl = data.logoUrl;

    if (data.location) {
      if (
        !Array.isArray(data.location.coordinates) ||
        data.location.coordinates.length !== 2
      ) {
        throw AppErrors.badRequest("Invalid location coordinates");
      }
      store.location = {
        type: "Point",
        coordinates: data.location.coordinates,
      };
    }

    if (data.policies) {
      store.policies = {
        shipping: data.policies.shipping,
        returns: data.policies.returns,
      };
    }

    // Save updated store within transaction (triggers validation + hooks)
    await store.save({ session });

    await session.commitTransaction();
    session.endSession();

    return store;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw AppErrors.badRequest(err.message);
  }
};


/**
 * Deletes a store by its ID.
 *
 * @param {string} id - The store ID.
 * @returns {Promise<void>}
 * @throws {AppError} - Throws if store is not found.
 */
const deleteStore = async (storeId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const store = await Store.findById(storeId).session(session);
    if (!store) {
      throw AppErrors.notFound("Store not found");
    }

    // Optional: Soft delete store instead of hard delete
    store.isDeleted = true;
    await store.save({ session });

    // Hard delete store
    await Store.findByIdAndDelete(storeId).session(session);

    // Delete related products (soft delete recommended)
    await Product.updateMany(
      { store: storeId },
      { $set: { isDeleted: true } },
      { session }
    );

    // Remove store reference from user
    const user = await User.findById(store.owner).session(session);
    if (user) {
      user.storesCount -= 1; // Decrement user's store count
      await user.save({ session });
    }

    // // Delete related coupons (if you want to delete or deactivate)
    await Coupon.updateMany(
      { store: storeId },
      { $set: { isDeleted: true } },
      { session }
    );

    // // Optionally remove store reference from categories
    await Category.updateMany(
      { stores: storeId },
      { $inc: { storesCount: -1 } },
      { session }
    );

    // // Optionally mark orders as storeDeleted or handle per business logic
    await Order.updateMany(
      { store: storeId },
      { $set: { storeDeleted: true } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    return store; // Return the deleted store document if needed
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw AppErrors.badRequest(err.message);
  }
};

export default {
  createStore,
  getAllStores,
  getStoreById,
  deleteStore,
  updateStore,
};
