
import asyncWrapper from "../middlewares/async.wrapper.js";
import productService from "../services/product.service.js";
import JSEND_STATUS from "../utils/http.status.message.js";
import StatusCodes from "../utils/status.codes.js";

// Create product
const createProduct = asyncWrapper(async (req, res) => {
  const product = await productService.createProduct(req.body, req.file);
  res.status(StatusCodes.CREATED).json({ status:JSEND_STATUS.SUCCESS, data: product });
});

// Get all products
const getAllProducts = asyncWrapper(async (req, res) => {
  const data = await productService.getAllProducts(req.query);
  res.status(StatusCodes.OK).json({ status:JSEND_STATUS.SUCCESS, ...data });
});

// Get product by ID
const getProductById = asyncWrapper(async (req, res) => {
  const product = await productService.getPJSEND_STATUS.SUCCESS(req.params.productId);
  res.status(StatusCodes.OK).json({ status:JSEND_STATUS.SUCCESS, data: product });
});

// Update product
const updateProduct = asyncWrapper(async (req, res) => {
  const product = await productService.updateProduct(req.params.productId, req.body);
  res.status(StatusCodes.OK).json({ status:JSEND_STATUS.SUCCESS, data: product });
});

// Delete product
const deleteProduct = asyncWrapper(async (req, res) => {
  await productService.deleteProduct(req.params.productId);
  res.status(StatusCodes.NO_CONTENT).send();
});

// Add variant
const addVariant = asyncWrapper(async (req, res) => {
  const product = await productService.addVariant(req.params.productId, req.body);
  res.status(StatusCodes.CREATED).json({ status:JSEND_STATUS.SUCCESS, data: product });
});

// Update variant
const updateVariant = asyncWrapper(async (req, res) => {
  const product = await productService.updateVariant(req.params.productId, req.params.variantId, req.body);
  res.status(StatusCodes.OK).json({ status:JSEND_STATUS.SUCCESS, data: product });
});

// Delete variant
const deleteVariant = asyncWrapper(async (req, res) => {
  await productService.deleteVariant(req.params.productId, req.params.variantId);
  res.status(StatusCodes.NO_CONTENT).send();
});

// Add images
const addImages = asyncWrapper(async (req, res) => {
  const product = await productService.addImages(req.params.productId, req.files);
  res.status(StatusCodes.CREATED).json({ status:JSEND_STATUS.SUCCESS, data: product });
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
  addImages
};
