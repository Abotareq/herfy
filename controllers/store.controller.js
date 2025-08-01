import asyncWrapper from "../middlewares/async.wrapper.js";
import storeService from "../services/store.service.js";
import JSEND_STATUS from "../utils/http.status.message.js";
import StatusCodes from "../utils/status.codes.js";

/**
 * Create a new store
 *
 * @async
 * @function createStore
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const createStore = asyncWrapper(async (req, res) => {
  const data = req.body;

  // Attach the authenticated user as the store owner

  // for prod
  data.owner = req.user._id;

  //for test
  // data.owner = "64e5a9f831f60c5edc2e0bf2";

  // If multer uploaded a file, the info is in req.file
  if (req.file) {
    // Store the logo URL or path in your data before saving
    data.logoUrl = req.file.path; // or req.file.location if using S3 or cloud storage
  }

  const store = await storeService.createStore(data);

  res.status(StatusCodes.CREATED).json({
    status: JSEND_STATUS.SUCCESS,
    data: store,
  });
});

/**
 * Get all stores with optional pagination and filters
 *
 * @async
 * @function getAllStores
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getAllStores = asyncWrapper(async (req, res) => {
  const { page, limit, search, status } = req.query;

  const result = await storeService.getAllStores({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    status,
  });

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: result.stores,
    pagination: {
      total: result.total,
      currentPage: page,
      limit,
    },
  });
});

/**
 * Get a store by ID
 *
 * @async
 * @function getStoreById
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getStoreById = asyncWrapper(async (req, res) => {
  const { storeId } = req.params;

  const store = await storeService.getStoreById(storeId);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: store,
  });
});

/**
 * Update a store by ID
 *
 * @async
 * @function updateStore
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateStore = asyncWrapper(async (req, res) => {
  const storeId = req.params.storeId;
  const data = req.body;
// for prod
  data.owner = req.user._id;

  //for test
  // data.owner = "64e5a9f831f60c5edc2e0bf2";
  // If a new logo file is uploaded, update the logoUrl
  if (req.file) {
    data.logoUrl = req.file.path; // or req.file.location if you use cloud storage
  }


  const updatedStore = await storeService.updateStore(storeId, data);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: updatedStore,
  });
});

/**
 * Delete a store by ID
 *
 * @async
 * @function deleteStore
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteStore = asyncWrapper(async (req, res) => {
  const { storeId } = req.params;
  const deletedStore = await storeService.deleteStore(storeId);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    message: "Store deleted successfully",
    data: deletedStore, // Return the deleted store document if needed
  });

});

export default {
  createStore,
  getAllStores,
  getStoreById,
  updateStore,
  deleteStore,
};
