
import productController from "../controllers/product.controller.js";
import express from "express";
import validate from "../middlewares/validate.middleware.js";
import { requireAuth, checkRole, optionalAuth } from "../auth/auth.middleware.js";
import { 
  createProductSchema, 
  createVariantSchema, 
  updateProductSchema, 
  updateVariantSchema 
} from "../validations/product.validation.js";
import { parseVariantsMiddleware } from "../middlewares/parseVariants.js";
import userRole from "../utils/user.role.js";
import { uploadCloudinary } from "../middlewares/cloudinary.middleware.js";

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
  /**
   * @route POST /products/:productId/images
   * @desc Upload multiple images for a product
   * @access Private (owner or admin)
   */
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
router.get("/", 
  optionalAuth,
  productController.getAllProducts);
// router.get("/", optionalAuth, productController.getAllProducts);

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
 * PRIVATE ROUTES (Seller, Admin)
 * ================================
 */

// Global authentication & authorization for all routes below
router.use(requireAuth);
router.use(checkRole([userRole.VENDOR, userRole.ADMIN]));

//*! Added by Osama Saad
// ADDED: A new route specifically for admins to manage product status.
// It should be placed within the private routes section.
/**
 * @route PATCH /:productId/status
 * @desc Update product status
 * @access Admin
 */
router.patch(
  "/:productId/status",
  requireAuth, // 1. User must be logged in.
  checkRole(userRole.ADMIN), // 2. User must have the 'admin' role.
  productController.updateProductStatus
);


// router.route('/stats').get(getProductStats);


/**
 * @route /products
 * @desc Create product
 * @access Seller, Admin
 */
router.route("/")
  .post(
    requireAuth,     // osama saad
    uploadCloudinary.array("images"),
    // upload.single("image"),
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
    uploadCloudinary.array("images"),
    // upload.single("image"),
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
    uploadCloudinary.array("images"),
    productController.addImages
  );

export default router;

