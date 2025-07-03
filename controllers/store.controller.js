import storeService from "../services/store.service.js";
import asyncWrapper from "../middlewares/async.wrapper.js";
import StatusCodes from "../utils/status.codes.js"
import JSEND_STATUS from "../utils/http.status.message.js"

export const createStore = asyncWrapper(async (req, res) => {
  const data = req.body;
  const store = await storeService.createStore(data);

  res.status(StatusCodes.CREATED).json({
    status: JSEND_STATUS.SUCCESS,
    data: store,
  });
});

export const getAllStores = asyncWrapper(async (req, res) => {
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

export const getStoreById = asyncWrapper(async (req, res) => {
  const { storeId } = req.params;
  const store = await storeService.getStoreById(storeId);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: store,
  });
});

export const updateStore = asyncWrapper(async (req, res) => {
  const { storeId } = req.params;
  const updatedStore = await storeService.updateStore(storeId, req.body);

  res.status(StatusCodes.OK).json({
    status: JSEND_STATUS.SUCCESS,
    data: updatedStore,
  });
});

export const deleteStore = asyncWrapper(async (req, res) => {
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