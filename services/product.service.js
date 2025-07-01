import Product from "../models/productModel.js";
import appErrors from "../utils/app.errors.js";

// Create product
const createProduct = async (data, file) => {
  if (file) data.image = file.filename; // or file.path based on multer config
  const product = new Product(data);
  return await product.save();
};

/**
 * Builds the query object for product filters
 */
const buildProductFilterQuery = ({ category, search, color, size, minPrice, maxPrice }) => {
  const query = {};

  // Search by name
  if (search) query.name = { $regex: search, $options: "i" };

  // Filter by category
  if (category) query.category = category;

  // Filter by color or size from variants
  if (color) query["variants.options.value"] = color;
  if (size) query["variants.options.value"] = size;

  // Filter by price range
  if (minPrice || maxPrice) {
    query.basePrice = {};
    if (minPrice) query.basePrice.$gte = parseFloat(minPrice);
    if (maxPrice) query.basePrice.$lte = parseFloat(maxPrice);
  }

  return query;
};

const getAllProducts = async ({ page = 1, limit = 10, category, search, color, size, minPrice, maxPrice }) => {
  const query = buildProductFilterQuery({ category, search, color, size, minPrice, maxPrice });

  const totalProducts = await Product.countDocuments(query);
  const totalPages = Math.ceil(totalProducts / limit);

  const products = await Product.find(query)
    .skip((page - 1) * limit)
    .limit(limit);

  return { products, totalProducts, totalPages, currentPage: page, limit };
};

// Get product by ID
const getProductById = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw appErrors.notFound("Product not found");
  return product;
};

// Update product
const updateProduct = async (id, data) => {
  const product = await Product.findByIdAndUpdate(id, data, { new: true });
  if (!product) throw appErrors.notFound("Product not found");
  return product;
};

// Delete product
const deleteProduct = async (id) => {
  const result = await Product.findByIdAndDelete(id);
  if (!result) throw appErrors.notFound("Product not found");
};

// Add variant
const addVariant = async (productId, variantData) => {
  const product = await Product.findById(productId);
  if (!product) throw appErrors.notFound("Product not found");
  product.variants.push(variantData);
  await product.save();
  return product;
};

// Update variant
const updateVariant = async (productId, variantId, variantData) => {
  const product = await Product.findById(productId);
  if (!product) throw appErrors.notFound("Product not found");

  const variant = product.variants.id(variantId);
  if (!variant) throw appErrors.notFound("Variant not found");

  variant.set(variantData);
  await product.save();
  return product;
};

// Delete variant
const deleteVariant = async (productId, variantId) => {
  const product = await Product.findById(productId);
  if (!product) throw appErrors.notFound("Product not found");

  const variant = product.variants.id(variantId);
  if (!variant) throw appErrors.notFound("Variant not found");

  variant.remove();
  await product.save();
};

// Add images
const addImages = async (productId, files) => {
  const product = await Product.findById(productId);
  if (!product) throw appErrors.notFound("Product not found");

  const imagePaths = files.map(file => file.filename); // or file.path
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
