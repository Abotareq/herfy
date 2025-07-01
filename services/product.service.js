import Product from "../models/productModel.js";
import appErrors from "../utils/app.errors.js";

/**
 * Builds the query object for product filters.
 *
 * @param {object} filters - Filters to apply.
 * @param {string} [filters.category] - Category ID.
 * @param {string} [filters.search] - Search string for product name.
 * @param {string} [filters.color] - Color filter.
 * @param {string} [filters.size] - Size filter.
 * @param {number} [filters.minPrice] - Minimum price.
 * @param {number} [filters.maxPrice] - Maximum price.
 * @returns {object} - The MongoDB query object.
 */
const buildProductFilterQuery = ({ category, search, color, size, minPrice, maxPrice }) => {
  const query = {};

  if (search) query.name = { $regex: search, $options: "i" };
  if (category) query.category = category;
  if (color) query["variants.options.value"] = color;
  if (size) query["variants.options.value"] = size;

  if (minPrice || maxPrice) {
    query.basePrice = {};
    if (minPrice) query.basePrice.$gte = parseFloat(minPrice);
    if (maxPrice) query.basePrice.$lte = parseFloat(maxPrice);
  }

  return query;
};

/**
 * Creates a new product.
 *
 * @param {object} data - Product data.
 * @param {object} [file] - Uploaded file (image).
 * @returns {Promise<object>} - The created product.
 */
const createProduct = async (data, file) => {
  if (file) data.image = file.filename; // adjust based on multer storage config
  const product = new Product(data);
  return await product.save();
};

/**
 * Retrieves all products with filters and pagination.
 *
 * @param {object} options - Options for retrieval.
 * @param {number} [options.page=1] - Current page.
 * @param {number} [options.limit=10] - Items per page.
 * @param {string} [options.category] - Category filter.
 * @param {string} [options.search] - Search string.
 * @param {string} [options.color] - Color filter.
 * @param {string} [options.size] - Size filter.
 * @param {number} [options.minPrice] - Minimum price.
 * @param {number} [options.maxPrice] - Maximum price.
 * @returns {Promise<object>} - An object containing products, pagination info.
 */
const getAllProducts = async ({ page = 1, limit = 10, category, search, color, size, minPrice, maxPrice }) => {
  const query = buildProductFilterQuery({ category, search, color, size, minPrice, maxPrice });

  const totalProducts = await Product.countDocuments(query);
  const totalPages = Math.ceil(totalProducts / limit);

  const products = await Product.find(query)
    .skip((page - 1) * limit)
    .limit(limit);

  return { products, totalProducts, totalPages, currentPage: page, limit };
};

/**
 * Retrieves a product by ID.
 *
 * @param {string} id - Product ID.
 * @returns {Promise<object>} - The product document.
 * @throws {AppError} - Throws if not found.
 */
const getProductById = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw appErrors.notFound("Product not found");
  return product;
};

/**
 * Updates a product by ID.
 *
 * @param {string} id - Product ID.
 * @param {object} data - Update data.
 * @returns {Promise<object>} - Updated product.
 * @throws {AppError} - Throws if not found.
 */
const updateProduct = async (id, data) => {
  const product = await Product.findByIdAndUpdate(id, data, { new: true });
  if (!product) throw appErrors.notFound("Product not found");
  return product;
};

/**
 * Deletes a product by ID.
 *
 * @param {string} id - Product ID.
 * @returns {Promise<void>}
 * @throws {AppError} - Throws if not found.
 */
const deleteProduct = async (id) => {
  const result = await Product.findByIdAndDelete(id);
  if (!result) throw appErrors.notFound("Product not found");
};

/**
 * Adds a new variant to a product.
 *
 * @param {string} productId - Product ID.
 * @param {object} variantData - Variant details.
 * @returns {Promise<object>} - Updated product.
 * @throws {AppError} - Throws if product not found.
 */
const addVariant = async (productId, variantData) => {
  const product = await Product.findById(productId);
  if (!product) throw appErrors.notFound("Product not found");

  product.variants.push(variantData);
  await product.save();
  return product;
};

/**
 * Updates a variant of a product.
 *
 * @param {string} productId - Product ID.
 * @param {string} variantId - Variant ID.
 * @param {object} variantData - Data to update.
 * @returns {Promise<object>} - Updated product.
 * @throws {AppError} - Throws if product or variant not found.
 */
const updateVariant = async (productId, variantId, variantData) => {
  const product = await Product.findById(productId);
  if (!product) throw appErrors.notFound("Product not found");

  const variant = product.variants.id(variantId);
  if (!variant) throw appErrors.notFound("Variant not found");

  variant.set(variantData);
  await product.save();
  return product;
};

/**
 * Deletes a variant from a product.
 *
 * @param {string} productId - Product ID.
 * @param {string} variantId - Variant ID.
 * @returns {Promise<void>}
 * @throws {AppError} - Throws if product or variant not found.
 */
const deleteVariant = async (productId, variantId) => {
  const product = await Product.findById(productId);
  if (!product) throw appErrors.notFound("Product not found");

  const variant = product.variants.id(variantId);
  if (!variant) throw appErrors.notFound("Variant not found");

  variant.remove();
  await product.save();
};

/**
 * Adds multiple images to a product.
 *
 * @param {string} productId - Product ID.
 * @param {array} files - Uploaded files.
 * @returns {Promise<object>} - Updated product.
 * @throws {AppError} - Throws if product not found.
 */
const addImages = async (productId, files) => {
  const product = await Product.findById(productId);
  if (!product) throw appErrors.notFound("Product not found");

  const imagePaths = files.map(file => file.filename);
  product.images.push(...imagePaths);
  await product.save();
  return product;
};

export default {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addVariant,
  updateVariant,
  deleteVariant,
  addImages,
  buildProductFilterQuery
};
