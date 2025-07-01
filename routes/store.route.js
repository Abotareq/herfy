import express from "express";
import storeController from "../controllers/store.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { createStoreSchema, updateStoreSchema } from "../validations/store.validation.js";

const router = express.Router();
/*
| **Method** | **Endpoint**           | **Description**                   | **Body / Params Example**                                                                                                                                                                                                                                                                                                                           | **Response**                            |
| ---------- | ---------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **POST**   | `/api/stores`          | Create a new store                | `json { "owner": "60c72b2f9b1d4c001c8e4f11", "name": "Natural Skincare Egypt", "description": "Organic oils and soaps", "logoUrl": "https://example.com/logo.png", "status": "pending", "location": { "type": "Point", "coordinates": [31.2357, 30.0444] }, "policies": { "shipping": "Ships in 2-4 days", "returns": "Returns within 7 days" } } ` | **201 Created** with store object       |
| **GET**    | `/api/stores`          | Get all stores (supports filters) | **Query params:** `page=1&limit=10&search=Natural&status=approved`                                                                                                                                                                                                                                                                                  | **200 OK** with `{ total, stores }`     |
| **GET**    | `/api/stores/:storeId` | Get store by ID                   | **URL param:** `storeId = 60c72b2f9b1d4c001c8e4f12`                                                                                                                                                                                                                                                                                                 | **200 OK** with store object or **404** |
| **PATCH**  | `/api/stores/:storeId` | Update store by ID                | `json { "name": "Updated Natural Skincare", "description": "Updated description here." } `                                                                                                                                                                                                                                                          | **200 OK** with updated store object    |
| **DELETE** | `/api/stores/:storeId` | Delete store by ID                | **URL param:** `storeId = 60c72b2f9b1d4c001c8e4f12`                                                                                                                                                                                                                                                                                                 | **204 No Content** or **404 Not Found** |

 */
/**
 * @route GET /stores
 * @desc Get all stores with optional pagination and filters
 * @access Public
 *
 * @route POST /stores
 * @desc Create a new store
 * @access Private (requires owner authorization)
 */
router.route("/")
  .get(storeController.getAllStores)
  .post(validate(createStoreSchema), storeController.createStore);

/**
 * @route GET /stores/:storeId
 * @desc Get a single store by ID
 * @access Public
 *
 * @route PATCH /stores/:storeId
 * @desc Update a store by ID
 * @access Private (requires owner or admin authorization)
 *
 * @route DELETE /stores/:storeId
 * @desc Delete a store by ID
 * @access Private (requires owner or admin authorization)
 */
router.route("/:storeId")
  .get(storeController.getStoreById)
  .patch(validate(updateStoreSchema), storeController.updateStore)
  .delete(storeController.deleteStore);

export default router;
