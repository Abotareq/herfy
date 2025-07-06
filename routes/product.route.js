import express from "express";
import productController from "../controllers/product.controller.js";
import validate from "../middlewares/validate.middleware.js";
import upload from "../middlewares/uploade.middleware.js";
import { requireAuth, checkRole } from "../auth/auth.middleware.js";
import { 
  createProductSchema, 
  createVariantSchema, 
  updateProductSchema, 
  updateVariantSchema 
} from "../validations/product.validation.js";
import { parseVariantsMiddleware } from "../middlewares/parseVariants.js";

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

/**
 * ================================
 * 🔐 PRIVATE ROUTES (Seller, Admin)
 * ================================
 */

// Global authentication & authorization for all routes below
router.use(requireAuth);
router.use(checkRole(["seller", "admin"]));

/**
 * @route /products
 * @desc Create product
 * @access Seller, Admin
 */
router.route("/")
  .post(
    upload.single("image"),
    parseVariantsMiddleware,
    validate(createProductSchema),
    productController.createProduct
  );

/**
 * @route /products/:productId
 * @desc Update or delete product by ID
 * @access Seller, Admin
 */
router.route("/:productId")
  .patch(
    upload.single("image"),
    parseVariantsMiddleware,
    validate(updateProductSchema),
    productController.updateProduct
  )
  .delete(productController.deleteProduct);

/**
 * @route /products/:productId/variant
 * @desc Add variant to product
 * @access Seller, Admin
 */
router.route("/:productId/variant")
  .post(
    validate(createVariantSchema),
    productController.addVariant
  );

/**
 * @route /products/:productId/variant/:variantId
 * @desc Update or delete variant by ID
 * @access Seller, Admin
 */
router.route("/:productId/variant/:variantId")
  .patch(
    validate(updateVariantSchema),
    productController.updateVariant
  )
  .delete(productController.deleteVariant);

/**
 * @route /products/:productId/images
 * @desc Add multiple images to product
 * @access Seller, Admin
 */
router.route("/:productId/images")
  .post(
    upload.array("images"),
    productController.addImages
  );

export default router;
