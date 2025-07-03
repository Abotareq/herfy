import express from "express";
import productController from "../controllers/product.controller.js";
import upload from "../middlewares/uploade.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
} from "../validations/product.validation.js";
import { requireAuth, checkRole } from "../auth/auth.middleware.js";

const router = express.Router();

/**
 * ================================
 *  PUBLIC ROUTES
 * ================================
 */

/**
 * @route GET /products
 * @desc Get all products with filters, pagination, search
 * @access Public
 */
router.get("/", productController.getAllProducts);

/**
 * @route GET /products/search
 * @desc Search products by keyword
 * @access Public
 */
router.get("/search", productController.searchProducts);

/**
 * @route GET /products/:productId
 * @desc Get product details by ID
 * @access Public
 */
router.get("/:productId", productController.getProductById);


// ================================
//  Protected Routes
// ================================

router.use(requireAuth); // Require authentication for routes below

/**
 * @route POST /products
 * @desc Create new product (image upload)
 * @access Private (seller, admin)
 */
router.post(
  "/",
  checkRole(["seller", "admin"]),
  upload.single("image"),
  validate(createProductSchema),
  productController.createProduct
);

/**
 * @route PATCH /products/:productId
 * @desc Update product by ID
 * @access Private (seller, admin)
 */
router.patch(
  "/:productId",
  checkRole(["seller", "admin"]),
  upload.single("image"),
  validate(updateProductSchema),
  productController.updateProduct
);

/**
 * @route DELETE /products/:productId
 * @desc Delete product by ID
 * @access Private (seller, admin)
 */
router.delete(
  "/:productId",
  checkRole(["seller", "admin"]),
  productController.deleteProduct
);


/**
 * @route POST /products/:productId/variants
 * @desc Add variant to product
 * @access Private (seller, admin)
 */
router.post(
  "/:productId/variants",
  checkRole(["seller", "admin"]),
  validate(createVariantSchema),
  productController.addVariant
);

/**
 * @route PATCH /products/:productId/variants/:variantId
 * @desc Update variant by ID
 * @access Private (seller, admin)
 */
router.patch(
  "/:productId/variants/:variantId",
  checkRole(["seller", "admin"]),
  validate(updateVariantSchema),
  productController.updateVariant
);

/**
 * @route DELETE /products/:productId/variants/:variantId
 * @desc Delete variant by ID
 * @access Private (seller, admin)
 */
router.delete(
  "/:productId/variants/:variantId",
  checkRole(["seller", "admin"]),
  productController.deleteVariant
);

/**
 * @route POST /products/:productId/images
 * @desc Upload multiple images to product
 * @access Private (seller, admin)
 */
router.post(
  "/:productId/images",
  checkRole(["seller", "admin"]),
  upload.array("images"),
  productController.addImages
);

export default router;
