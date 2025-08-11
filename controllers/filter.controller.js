// filter category by name
// filter coupon by active
// filter review for products and shops
import httpStatus from "../utils/http.status.message.js";
import StatusCodes from "../utils/status.codes.js";
import Category from "../models/categoryModel.js";
import Coupon from "../models/cuponModel.js";
import Review from "../models/reviewModel.js";

export const filterCategoryByName = async (req, res, next) => {
  const { name } = req.query;

  if (!name) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: httpStatus.ERROR,
      data: { message: "Please provide a name to filter by." },
    });
  }

  try {
    const filter = {
      name: { $regex: name, $options: "i" },
    };

    const result = await Category.find(filter);

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { result },
    });
  } catch (error) {
    next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const filterCouponByActive = async (req, res, next) => {
  const query = req.query;
  const isActive = (query.isActive = true);
  if (isActive === undefined) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({
        status: httpStatus.ERROR,
        data: { message: "missing query parameter" },
      });
  }
  try {
    const filter = { isActive: isActive === "true" };
    const result = Coupon.find(filter);
    if (!result) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({
          status: httpStatus.FAIL,
          data: { message: "No Coupon Found" },
        });
    }
    res
      .status(StatusCodes.OK)
      .json({ status: httpStatus.SUCCESS, data: { result } });
  } catch (error) {
    next(next(new ErrorResponse(error, StatusCodes.INTERNAL_SERVER_ERROR)));
  }
};
export const filterReviewByProducts = async (req, res, next) => {
  try {
    const { productId, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { entityType: "Product", entityId: productId };

    const review = await Review.find(filter)
      .populate("user")
      .limit(parseInt(limit))
      .skip(skip);

    if (review.length === 0) {
      return next(new ErrorResponse("Review Not Found", StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { review },
    });
  } catch (error) {
    next(new ErrorResponse(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const filterReviewByShops = async (req, res, next) => {
  try {
    const { shopId, page = 1, limit = 10 } = req.query;
    if (!shopId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: httpStatus.ERROR,
        data: { message: "Shop ID is required" },
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { entityType: "store", entityId: shopId };

    const review = await Review.find(filter)
      .populate("user")
      .limit(parseInt(limit))
      .skip(skip);

    if (review.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: httpStatus.FAIL,
        data: { message: "Can't find this shop" },
      });
    }

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { review },
    });
  } catch (error) {
    next(new ErrorResponse(error, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const fiterUserByRole = async (req, res, next) => {
  const admin = req.user;
  if (!admin) {
    return next(
      new ErrorResponse("Unauthorized User", StatusCodes.UNAUTHORIZED)
    );
  }
  const { role } = req.query;
  let filter = {};

  if (role && role.trim() !== "") {
    filter.role = role;
  }
  try {
    const result = await User.find(filter).populate("role");
    res
      .status(StatusCodes.OK)
      .json({ status: httpStatus.SUCCESS, data: { result } });
  } catch (error) {
    next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
