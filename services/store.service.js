
import Store from "../models/storeModel.js";
import AppErrors from "../utils/app.errors.js";


/**
 * Builds a MongoDB query object for filtering stores.
 *
 * @param {object} filters - The filters to apply.
 * @param {string} [filters.search] - Search string for store name.
 * @param {string} [filters.status] - Status filter (pending, approved, rejected, suspended).
 * @returns {object} - The constructed MongoDB query.
 *
 * @example
 * const query = buildStoreFilterQuery({ search: "handmade", status: "approved" });
 */
const buildStoreFilterQuery = ({ search, status }) => {
    const query = {};
    if (search) query.name = { $regex: search, $options: "i" };
    if (status) query.status = status;
    return query;
};

/**
 * Creates a new store document.
 *
 * @param {object} data - The store data to create.
 * @returns {Promise<object>} - The created store document.
 */
const createStore = async (data) => {
    const store = new Store(data);
    return await store.save();
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

  const total = await Store.countDocuments(query);
  const stores = await Store.find(query)
    .skip((page - 1) * limit)
    .limit(limit);

  return { total, stores };
};

/**
 * Retrieves a store by its ID.
 *
 * @param {string} id - The store ID.
 * @returns {Promise<object>} - The store document.
 * @throws {AppError} - Throws if store is not found.
 */
const getStoreById = async (id) => {
  const store = await Store.findById(id);
  if (!store) throw AppErrors.notFound("Store not found");
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
  const store = await Store.findByIdAndUpdate(id, data, { new: true });
  if (!store) throw appErrors.notFound("Store not found");
  return store;
};

/**
 * Deletes a store by its ID.
 *
 * @param {string} id - The store ID.
 * @returns {Promise<void>}
 * @throws {AppError} - Throws if store is not found.
 */
const deleteStore = async (id) => {
  const result = await Store.findByIdAndDelete(id);
  if (!result) throw appErrors.notFound("Store not found");
};

export default{
    createStore,
    getAllStores,
    getStoreById,
    deleteStore,
    updateStore
}