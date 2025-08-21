import express from "express";
import storeController from "../controllers/store.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { requireAuth, checkRole } from "../auth/auth.middleware.js";
import { createStoreSchema, updateStoreSchema } from "../validations/store.validation.js";
import storeParserMiddleware from "../middlewares/store.parse.js";
import userRole from "../utils/user.role.js";
import { uploadCloudinary } from "../middlewares/cloudinary.middleware.js";

const router = express.Router();

/**
 * ================================
 *  PUBLIC ROUTES
 * ================================
 */

/**
 * @route GET /stores
 * @desc Get all stores with optional pagination and filters
 * @access Public
 */
router.get("/", storeController.getAllStores);

/**
 * @route GET /stores/:storeId
 * @desc Get a single store by ID
 * @access Public
 */
router.get("/:storeId", storeController.getStoreById);

/**
 * ================================
 *  PRIVATE ROUTES (Owner, Admin)
 * ================================
 */




// Global authentication & authorization for routes below

//for prod
router.use(requireAuth);

/**
 * @route GET /stores/vendor
 * @desc Get stores of the authenticated vendor/admin
 * @access Private (Vendor/Admin)
 */
router.get(
  "/vendor/vendor",
  checkRole([userRole.VENDOR, userRole.ADMIN]),
  storeController.getStoresByVendor
);
/**
 * @route /stores
 * @desc Create store
 * @access Private (Owner, Admin)
 */
router.route("/")
  .post(
    uploadCloudinary.single("logoUrl"),
    // upload.single("logoUrl"),
    storeParserMiddleware,
    checkRole([userRole.VENDOR,userRole.ADMIN]),
    validate(createStoreSchema),
    storeController.createStore
  );

/**
 * @route /stores/:storeId
 * @desc Update or delete store by ID
 * @access Private (Owner, Admin)
 */
router.route("/:storeId")
  .patch(
    uploadCloudinary.single("logoUrl"),
    // upload.single("image"),
    storeParserMiddleware,
    checkRole([userRole.VENDOR,userRole.ADMIN]),
    validate(updateStoreSchema),
    storeController.updateStore
  )
  .delete(checkRole([userRole.ADMIN , userRole.VENDOR]),storeController.deleteStore);

export default router;
