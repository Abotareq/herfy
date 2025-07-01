import asyncWrapper from "../middlewares/async.wrapper.js";
import productService from "../services/product.service.js";
import JSEND_STATUS from "../utils/http.status.message.js";
import StatusCodes from "../utils/status.codes.js";

/**
 * Create a new product.
 * @route POST /products
 * @access Private (requires authorization)
 * @param {Object} req.body - Product data.
 * @param {File} req.file - Optional product image.
 * @returns {Object} Created product.
 */
const createProduct = asyncWrapper(async (req, res) => {
  const product = await productService.createProduct(req.body, req.file);
  res.status(StatusCodes.CREATED).json({ status: JSEND_STATUS.SUCCESS, data: product });
});

/**
 * Get all products with optional filters, pagination, and search.
 * @route GET /products
 * @access Public
 * @param {Object} req.query - Filters and pagination options.
 * @returns {Object} Products list and metadata.
 */
const getAllProducts = asyncWrapper(async (req, res) => {
  const data = await productService.getAllProducts(req.query);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, ...data });
});

/**
 * Get a product by its ID.
 * @route GET /products/:productId
 * @access Public
 * @param {string} req.params.productId - Product ID.
 * @returns {Object} Product details.
 */
const getProductById = asyncWrapper(async (req, res) => {
  const product = await productService.getProductById(req.params.productId);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: product });
});

/**
 * Update a product by its ID.
 * @route PATCH /products/:productId
 * @access Private (requires authorization)
 * @param {string} req.params.productId - Product ID.
 * @param {Object} req.body - Product data to update.
 * @returns {Object} Updated product.
 */
const updateProduct = asyncWrapper(async (req, res) => {
  const product = await productService.updateProduct(req.params.productId, req.body);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: product });
});

/**
 * Delete a product by its ID.
 * @route DELETE /products/:productId
 * @access Private (requires authorization)
 * @param {string} req.params.productId - Product ID.
 * @returns {void}
 */
const deleteProduct = asyncWrapper(async (req, res) => {
  await productService.deleteProduct(req.params.productId);
  res.status(StatusCodes.NO_CONTENT).send();
});

/**
 * Add a variant to a product.
 * @route POST /products/:productId/variants
 * @access Private (requires authorization)
 * @param {string} req.params.productId - Product ID.
 * @param {Object} req.body - Variant data.
 * @returns {Object} Updated product with new variant.
 */
const addVariant = asyncWrapper(async (req, res) => {
  const product = await productService.addVariant(req.params.productId, req.body);
  res.status(StatusCodes.CREATED).json({ status: JSEND_STATUS.SUCCESS, data: product });
});

/**
 * Update a variant of a product.
 * @route PATCH /products/:productId/variants/:variantId
 * @access Private (requires authorization)
 * @param {string} req.params.productId - Product ID.
 * @param {string} req.params.variantId - Variant ID.
 * @param {Object} req.body - Variant data to update.
 * @returns {Object} Updated product with updated variant.
 */
const updateVariant = asyncWrapper(async (req, res) => {
  const product = await productService.updateVariant(req.params.productId, req.params.variantId, req.body);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: product });
});

/**
 * Delete a variant from a product.
 * @route DELETE /products/:productId/variants/:variantId
 * @access Private (requires authorization)
 * @param {string} req.params.productId - Product ID.
 * @param {string} req.params.variantId - Variant ID.
 * @returns {void}
 */
const deleteVariant = asyncWrapper(async (req, res) => {
  await productService.deleteVariant(req.params.productId, req.params.variantId);
  res.status(StatusCodes.NO_CONTENT).send();
});

/**
 * Add multiple images to a product.
 * @route POST /products/:productId/images
 * @access Private (requires authorization)
 * @param {string} req.params.productId - Product ID.
 * @param {Array<File>} req.files - Array of image files.
 * @returns {Object} Updated product with added images.
 */
const addImages = asyncWrapper(async (req, res) => {
  const product = await productService.addImages(req.params.productId, req.files);
  res.status(StatusCodes.CREATED).json({ status: JSEND_STATUS.SUCCESS, data: product });
});

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
};
