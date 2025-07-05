import storeService from "../services/store.service.js";
import asyncWrapper from "../middlewares/async.wrapper.js";
import StatusCodes from "../utils/status.codes.js"
import JSEND_STATUS from "../utils/http.status.message.js"

const createStore = asyncWrapper(async (req, res) => {
  const data = req.body;

  // Attach the authenticated user as the store owner
  data.owner = req.user.id;

  // If multer uploaded a file, the info is in req.file
  if (req.file) {
    // Store the logo URL or path in your data before saving
    data.logoUrl = req.file.path;  // or req.file.location if using S3 or cloud storage
  }

  const store = await storeService.createStore(data);

  res.status(StatusCodes.CREATED).json({
    status: JSEND_STATUS.SUCCESS,
    data: store,
  });
});

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

const getStoreById = asyncWrapper(async (req, res) => {
  const { storeId } = req.params;
  const store = await storeService.getStoreById(storeId);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: store,
  });
});
const updateStore = asyncWrapper(async (req, res) => {
  const storeId = req.params.storeId;
  const data = req.body;

  // If a new logo file is uploaded, update the logoUrl
  if (req.file) {
    data.logoUrl = req.file.path; // or req.file.location if you use cloud storage
  }

  // You may want to ensure only the store owner or admin can update
  // This check depends on your auth setup and is just an example:
  // const store = await storeService.getStoreById(storeId);
  // if (store.owner.toString() !== req.user.id && !req.user.isAdmin) {
  //   throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  // }

  const updatedStore = await storeService.updateStore(storeId, data);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: updatedStore,
  });
});

const deleteStore = asyncWrapper(async (req, res) => {
  const { storeId } = req.params;
  await storeService.deleteStore(storeId);

  res.status(StatusCodes.NO_CONTENT).send();
});

export default {
  createStore,
  getAllStores,
  getStoreById,
  updateStore,
  deleteStore,
};