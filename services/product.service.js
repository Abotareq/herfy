
import Product from "../models/productModel.js";
import mongoose from "mongoose";
/**
 * Returns the MongoDB sort object based on the given sort key.
 *
 * @param {string} sort - The sort key indicating the sorting criteria.
 * Supported values:
 *   - "popularity_desc": Sort by reviewCount descending (most popular first)
 *   - "popularity_asc": Sort by reviewCount ascending
 *   - "rating_desc": Sort by averageRating descending (highest rating first)
 *   - "rating_asc": Sort by averageRating ascending
 *   - "latest": Sort by createdAt descending (newest first)
 *   - "oldest": Sort by createdAt ascending (oldest first)
 *   - "price_asc": Sort by price ascending (lowest price first)
 *   - "price_desc": Sort by price descending (highest price first)
 *
 * @returns {Object} MongoDB sort object, e.g. { fieldName: 1 } or { fieldName: -1 }.
 * Defaults to sorting by createdAt descending if the sort key is invalid or missing.
 */
const getSortOption = (sort) => {
  const sortOptionsMap = {
    popularity_desc: { reviewCount: -1 },
    popularity_asc: { reviewCount: 1 },
    rating_desc: { averageRating: -1 },
    rating_asc: { averageRating: 1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { basePrice: 1 },
    price_desc: { basePrice: -1 },
  };
  
  return sortOptionsMap[sort] || { createdAt: -1 };
};
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
 * Retrieves all products with filters, sorting, and pagination.
 *
 * @param {Object} options - Options for retrieving products.
 * @param {number} [options.page=1] - The current page number for pagination.
 * @param {number} [options.limit=10] - Number of products per page.
 * @param {string} [options.category] - Filter products by category.
 * @param {string} [options.search] - Search string to match product fields.
 * @param {string} [options.color] - Filter products by color.
 * @param {string} [options.size] - Filter products by size.
 * @param {number} [options.minPrice] - Minimum price filter.
 * @param {number} [options.maxPrice] - Maximum price filter.
 * @param {string} [options.sort] - Sorting criteria, possible values:
 *   - "popularity_desc" (default: most reviews first)
 *   - "popularity_asc"
 *   - "rating_desc"
 *   - "rating_asc"
 *   - "latest"
 *   - "oldest"
 *   - "price_asc"
 *   - "price_desc"
 *
 * @returns {Promise<Object>} Promise resolving to an object containing:
 *   - products: Array of product documents matching the filters.
 *   - totalProducts: Total number of products matching the filters.
 *   - totalPages: Total number of pages based on limit.
 *   - currentPage: The current page number.
 *   - limit: Number of products per page.
 */
const getAllProducts = async ({
  page = 1,
  limit = 10,
  category,
  search,
  color,
  size,
  minPrice,
  maxPrice,
  sort
}) => {
  const query = buildProductFilterQuery({ category, search, color, size, minPrice, maxPrice });

  const sortOption = getSortOption(sort);
  
  const totalProducts = await Product.countDocuments(query);
  const totalPages = Math.ceil(totalProducts / limit);
  console.log('sort param:', sort);
  console.log('sort option:', sortOption);
  const products = await Product.find(query)
    .sort(sortOption)
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
  const product = await Product.findById(id).lean();
  // const reviews = await Review.find({ product: productId }).populate("user", "name");
  if (!product) throw appErrors.notFound("Product not found");
  return { ...product };
};

/**
 * Searches products with query, filters, and pagination.
 *
 * @param {object} options - Search options.
 * @param {string} options.query - Search string.
 * @param {number} [options.page=1] - Current page.
 * @param {number} [options.limit=10] - Items per page.
 * @param {string} [options.category] - Category filter.
 * @param {string} [options.color] - Color filter.
 * @param {string} [options.size] - Size filter.
 * @param {number} [options.minPrice] - Minimum price.
 * @param {number} [options.maxPrice] - Maximum price.
 * @returns {Promise<object>} - Matching products with pagination info.
 */

const searchProducts = async ({
  query,
  page = 1,
  limit = 10,
  category,
  color,
  size,
  minPrice,
  maxPrice,
  sort, // pass sort here
}) => {
  const filterQuery = buildProductFilterQuery({ category, search: query, color, size, minPrice, maxPrice });

  const totalProducts = await Product.countDocuments(filterQuery);
  const totalPages = Math.ceil(totalProducts / limit);

  const sortOption = getSortOption(sort); // use your method here

  const products = await Product.find(filterQuery)
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit);

  return { products, totalProducts, totalPages, currentPage: page, limit };
};


/**
 * Creates a new product.
 *
 * @param {object} data - Product data.
 * @param {object} [file] - Uploaded file (image).
 * @returns {Promise<object>} - The created product.
 */

const createProduct = async (data, file) => {
  if (file) data.images = file.filename; // adjust based on multer storage config
  const product = new Product(data);
  return await product.save();
};


const updateProduct = async (productId, updateData, file) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new appErrors("Product not found", StatusCodes.NOT_FOUND);
  }

  // If there's an uploaded image file, update product's image URL/path
  if (file) {
    updateData.imageUrl = file.path; // or file.location if cloud storage like S3
  }

  // Update product fields with new data
  Object.keys(updateData).forEach((key) => {
    product[key] = updateData[key];
  });

  // Save updated product
  await product.save();

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

  const existingVariant = product.variants.find(
    (v) => v.name.toLowerCase() === variantData.name.toLowerCase()
  );

  if (existingVariant) {
    // Merge options
    existingVariant.options = existingVariant.options.concat(variantData.options);
  } else {
    product.variants.push(variantData);
  }

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

  console.log(typeof variant);  // Should be 'object'
  console.log(variant instanceof mongoose.Document);  // Should be true
  console.log(variant.remove); // Should NOT be undefined


  product.variants.pull(variantId);
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

export default{
    createProduct,
    getAllProducts,
    getProductById,
    searchProducts,
    updateProduct,
    deleteProduct,
    addVariant,
    deleteVariant,
    updateVariant,
    addImages
}