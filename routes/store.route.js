import express from "express";
import storeController from "../controllers/store.controller.js";
import validate from "../middlewares/validate.middleware.js";
import upload from "../middlewares/uploade.middleware.js";
import { requireAuth, checkRole } from "../auth/auth.middleware.js";
import { createStoreSchema, updateStoreSchema } from "../validations/store.validation.js";
import storeParserMiddleware from "../middlewares/store.parse.js";

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
 * 🔐 PRIVATE ROUTES (Owner, Admin)
 * ================================
 */

// Global authentication & authorization for routes below
router.use(requireAuth);
router.use(checkRole(["owner", "admin"]));

/**
 * @route /stores
 * @desc Create store
 * @access Private (Owner, Admin)
 */
router.route("/")
  .post(
    upload.single("logoUrl"),
    storeParserMiddleware,
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
    upload.single("image"),
    storeParserMiddleware,
    validate(updateStoreSchema),
    storeController.updateStore
  )
  .delete(storeController.deleteStore);

export default router;
