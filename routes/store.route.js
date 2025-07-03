import express from "express";
import storeController from "../controllers/store.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { createStoreSchema, updateStoreSchema } from "../validations/store.validation.js";
import upload from "../middlewares/uploade.middleware.js";
import { requireAuth, checkRole } from "../auth/auth.middleware.js";

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


// ================================
//  PROTECTED ROUTES
// ================================

router.use(requireAuth); // Require authentication for the routes below

/**
 * @route POST /stores
 * @desc Create a new store
 * @access Private (Owner, Admin)
 */
router.post(
  "/",
  checkRole(["owner", "admin"]),
  upload.single("image"),
  validate(createStoreSchema),
  storeController.createStore
);

/**
 * @route PATCH /stores/:storeId
 * @desc Update a store by ID
 * @access Private (Owner, Admin)
 */
router.patch(
  "/:storeId",
  checkRole(["owner", "admin"]),
  upload.single("image"),
  validate(updateStoreSchema),
  storeController.updateStore
);

/**
 * @route DELETE /stores/:storeId
 * @desc Delete a store by ID
 * @access Private (Owner, Admin)
 */
router.delete(
  "/:storeId",
  checkRole(["owner", "admin"]),
  storeController.deleteStore
);

export default router;
