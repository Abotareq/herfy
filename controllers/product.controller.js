

import asyncWrapper from "../middlewares/async.wrapper.js";
import productService from "../services/product.service.js"
import JSEND_STATUS from "../utils/http.status.message.js";
import StatusCodes from "../utils/status.codes.js";

/**
 * Get all products with optional filters, pagination, and search.
 * @route GET /api/products
 * @access Public
 * @param {Object} req.query - Filters and pagination options.
 * @returns {Object} Products list and metadata.
 */

//*!  Edit by osama
const getAllProducts = asyncWrapper(async (req, res) => {
  const data = await productService.getAllProducts(req.query,req.user);    //Added req.user by osama
  res.status(StatusCodes.OK).json(
    { status: JSEND_STATUS.SUCCESS, ...data });
});

/**
 * Get a product by its ID.
 * @route GET /api/products/:productId
 * @access Public
 * @param {string} req.params.productId - Product ID.
 * @returns {Object} Product details.
 */
const getProductById = asyncWrapper(async (req, res) => {
  const product = await productService.getProductById(req.params.productId,req.user);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: product });
});


// /**
//  * @desc    Get product statistics (counts by status)
//  * @route   GET /api/product/stats
//  * @access  Private/Admin
//  */
// const getProductStats = asyncHandler(async (req, res, next) => {
//   const approved = await Product.countDocuments({ status: 'approved' });
//   const pending = await Product.countDocuments({ status: 'pending' });
//   const rejected = await Product.countDocuments({ status: 'rejected' });
//   const total = await Product.countDocuments();

//   res.status(200).json({
//     success: true,
//     data: {
//       approved,
//       pending,
//       rejected,
//       total
//     }
//   });
// });


/**
 * Create a new product.
 * @route POST /api/products
 * @access Private (requires authorization)
 * @param {Object} req.body - Product data.
 * @param {File} req.file - Optional product image.
 * @returns {Object} Created product.
 */
// For test
// const userId = "64e5a9f831f60c5edc2e0bf2"
const createProduct = asyncWrapper(async (req, res) => {
  req.body.basePrice = Number(req.body.basePrice);

  const userId = req.user._id;
  const role =req.user.role;
  console.log("from contoller");
  // Determine if single or multiple files uploaded
  // console.log('req.files:', req.files);
  // console.log('req.body:', req.body);

  const createdProduct = await productService.createProduct(req.body, req.files, userId,role);

  res.status(201).json({
    status: 'success',
    data: createdProduct,
  });
});

/**
 * Search products by query with filters and pagination.
 * @route GET /api/products/search
 * @access Public
 * @param {Object} req.query - Search query and filters.
 * @returns {Object} Products matching search with pagination.
 */
const searchProducts = asyncWrapper(async (req, res) => {
  const data = await productService.searchProducts({
    query: req.query.q,
    page: req.query.page,
    limit: req.query.limit,
    category: req.query.category,
    color: req.query.color,
    size: req.query.size,
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    sort: req.query.sort
  });
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, ...data });
});


/**
 * Update a product by its ID.
 * @route PATCH /api/v1/products/:productId
 * @access Private (requires authorization)
 * @param {string} req.params.productId - Product ID.
 * @param {Object} req.body - Product data to update.
 * @returns {Object} Updated product.
 */
const updateProduct = asyncWrapper(async (req, res) => {
  //  Add validation before service call

  // for dev
  const product = await productService.updateProduct(req.params.productId, req.body, req.files ,req.user);   //update to be user instead of user._id
  
  // for test
  // const product = await productService.updateProduct(req.params.productId, req.body, req.file ,userId);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: product });
});


//*!  ADDED: New controller function for the admin status update route.
/**
 * Updates a product's status.
 * @route PATCH /api/product/:productId/status
 * @access Private (Admin only)
 * @param {string} req.params.productId - Product ID.
 * @param {Object} req.body - { status: 'approved' | 'rejected' | 'suspended' }.
 * @returns {Object} Updated product.
 */
const updateProductStatus = asyncWrapper(async (req, res) => {
  const product = await productService.updateStatusByAdmin(
    req.params.productId,
    req.body.status
  );
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: product });
});



/**
 * Delete a product by its ID.
 * @route DELETE /api/v1/products/:productId
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
 * @route POST /api/v1/products/:productId/variants
 * @access Private (requires authorization)
 * @param {string} req.params.productId - Product ID.
 * @param {Object} req.body - Variant data.
 * @returns {Object} Updated product with new variant.
 */
const addVariant = asyncWrapper(async (req, res) => {
  // Add validation for variant data
  const product = await productService.addVariant(req.params.productId, req.body);
  res.status(StatusCodes.CREATED).json({ status: JSEND_STATUS.SUCCESS, data: product });
});

/**
 * Update a variant of a product.
 * @route PATCH /api/v1/products/:productId/variants/:variantId
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
 * @route DELETE /api/v1/products/:productId/variants/:variantId
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
 * @route POST /api/v1/products/:productId/images
 * @access Private (requires authorization)
 * @param {string} req.params.productId - Product ID.
 * @param {Array<File>} req.files - Array of image files.
 * @returns {Object} Updated product with added images.
 */
const addImages = asyncWrapper(async (req, res) => {
  const product = await productService.addImages(req.params.productId, req.files);
  res.status(StatusCodes.CREATED).json({ status: JSEND_STATUS.SUCCESS, data: product });
});

/**
 * Soft delete a product by its ID.
 * @route PATCH /api/v1/products/:productId/soft-delete
 * @access Private (requires authorization)
 * @param {string} req.params.productId - Product ID.
 * @returns {Object} Soft deleted product.
 */
const softDeleteProduct = asyncWrapper(async (req, res) => {
  const product = await productService.SoftDeleteProduct(req.params.productId, req.user._id);
  res.status(StatusCodes.OK).json({ status: JSEND_STATUS.SUCCESS, data: product });
});


export default{
    createProduct,
    getAllProducts,
    getProductById,
    searchProducts,
    deleteProduct,
    updateProduct,
    addVariant,
    deleteVariant,
    updateVariant,
    addImages,
    softDeleteProduct,
    updateProductStatus,
    // getProductStats
}