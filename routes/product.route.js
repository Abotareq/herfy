import productController from "../controllers/product.controller.js";

import express from "express";
import { requireAuth ,checkRole } from "../auth/auth.middleware.js"

const router = express.Router()


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


//  router.use(requireAuth); // Require authentication for routes below

/**
 * @route POST /products
 * @desc Create new product (image upload)
 * @access Private (seller, admin)
 */
router.post(
    "/",
    // checkRole(["seller", "admin"]),
    upload.single("image"),
    parseVariantsMiddleware,
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
    // checkRole(["seller", "admin"]),
    upload.single("image"),
    parseVariantsMiddleware,
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
    // checkRole(["seller", "admin"]),
    productController.deleteProduct
);

/**
 * @route POST /products/:productId/variants
 * @desc Add variant to product
 * @access Private (seller, admin)
 */
router.post(
  "/:productId/variant",
//   checkRole(["seller", "admin"]),
  validate(createVariantSchema),
  productController.addVariant
);

/**
 * @route PATCH /products/:productId/variants/:variantId
 * @desc Update variant by ID
 * @access Private (seller, admin)
 */
router.patch(
  "/:productId/variant/:variantId",
//   checkRole(["seller", "admin"]),
  validate(updateVariantSchema),
  productController.updateVariant
);

/**
 * @route DELETE /products/:productId/variants/:variantId
 * @desc Delete variant by ID
 * @access Private (seller, admin)
 */
router.delete(
  "/:productId/variant/:variantId",
//   checkRole(["seller", "admin"]),
  productController.deleteVariant
);

router.post(
  "/:productId/images",
  // checkRole(["seller", "admin"]),
  upload.array("images"),
  productController.addImages
);
export default router ;