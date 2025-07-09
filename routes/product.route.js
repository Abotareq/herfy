
  import productController from "../controllers/product.controller.js";
  import uploadfrom from '../middlewares/uploade.middleware.js';
import express from "express";
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

  /*
  | **Method** | **Endpoint**                                   | **Description**                                         | **Body / Params Example**                                                                                                                                                         | **Response**                              |
  | ---------- | ---------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
  | **GET**    | `/api/products`                                | Get all products (supports filters, pagination, search) | **Query params example:** `/api/products?page=1&limit=10&search=handmade&category=60c72b...`                                                                                      | **200 OK** with `{ total, products }`     |
  | **POST**   | `/api/products`                                | Create new product (with image upload)                  | **Form-Data:** `image: (file)`, `name: Handmade Soap`, `basePrice: 50`, `category: 60c72b...`, `description: Natural soap`<br>**Note:** Uses `upload.single("image")` middleware. | **201 Created** with product object       |
  | **GET**    | `/api/products/search`                         | Search products                                         | **Query params example:** `/api/products/search?query=soap`                                                                                                                       | **200 OK** with results array             |
  | **GET**    | `/api/products/:productId`                     | Get product by ID                                       | **URL param:** `productId = 60c72b...`                                                                                                                                            | **200 OK** with product object or **404** |
  | **PATCH**  | `/api/products/:productId`                     | Update product by ID                                    | `json { "name": "Updated Soap", "basePrice": 55 } `                                                                                                                               | **200 OK** with updated product object    |
  | **DELETE** | `/api/products/:productId`                     | Delete product by ID                                    | **URL param:** `productId = 60c72b...`                                                                                                                                            | **204 No Content** or **404 Not Found**   |
  | **POST**   | `/api/products/:productId/variants`            | Add variant to a product                                | `json { "sku": "soap-lavender-001", "price": 60, "options": [{ "name": "color", "value": "purple" }] } `                                                                          | **201 Created** with variant object       |
  | **PATCH**  | `/api/products/:productId/variants/:variantId` | Update variant of a product                             | `json { "price": 65 } `                                                                                                                                                           | **200 OK** with updated variant object    |
  | **DELETE** | `/api/products/:productId/variants/:variantId` | Delete variant from product                             | **URL params:** `productId`, `variantId`                                                                                                                                          | **204 No Content** or **404 Not Found**   |
  | **POST**   | `/api/products/:productId/images`              | Add multiple images to a product                        | **Form-Data:** `images: (multiple files)`<br>**Note:** Uses `upload.array("images")` middleware.                                                                                  | **200 OK** with updated product images    |


  */ 
  /**
   * @route GET /products
   * @desc Get all products with support for filters, pagination, and search
   * @access Public
   *
   * @route POST /products
   * @desc Create a new product (supports image upload)
   * @access Private (requires authentication)
   */
  router.route("/")
    .get(productController.getAllProducts)
    .post(
      uploadfrom.single("image"),
      validate(createProductSchema),
      productController.createProduct
    );

  /**
   * @route GET /products/search
   * @desc Search products by keyword
   * @access Public
   */
  router.route("/search").get(productController.searchProducts);

  /**
   * @route GET /products/:productId
   * @desc Get product details by product ID
   * @access Public
   *
   * @route PATCH /products/:productId
   * @desc Update product details by product ID
   * @access Private (owner or admin)
   *
   * @route DELETE /products/:productId
   * @desc Delete product by product ID
   * @access Private (owner or admin)
   */
  router.route("/:productId")
    .get(productController.getProductById)
    .patch(validate(updateProductSchema), productController.updateProduct)
    .delete(productController.deleteProduct);

  /**
   * @route POST /products/:productId/variants
   * @desc Add a variant (e.g., color, size) to a product
   * @access Private (owner or admin)
   *
   * @route PATCH /products/:productId/variants/:variantId
   * @desc Update a product variant by variant ID
   * @access Private (owner or admin)
   *
   * @route DELETE /products/:productId/variants/:variantId
   * @desc Delete a product variant by variant ID
   * @access Private (owner or admin)
   */
  router.route("/:productId/variants")
    .post(validate(createVariantSchema), productController.addVariant);

  router.route("/:productId/variants/:variantId")
    .patch(validate(updateVariantSchema), productController.updateVariant)
    .delete(productController.deleteVariant);

  /**
   * @route POST /products/:productId/images
   * @desc Upload multiple images for a product
   * @access Private (owner or admin)
   */
  router.route("/:productId/images")
    .post(upload.array("images"), productController.addImages);

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
