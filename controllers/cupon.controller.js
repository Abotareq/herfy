import Coupon from "../models/cuponModel.js";
import StatusCodes from "../utils/status.codes.js";
import httpStatus from "../utils/http.status.message.js";
import ErrorResponse from "../utils/error-model.js";

// get All cupons
// admin can get all coupons to see them
export const getAllCupons = async (req, res, next) => {
  try {
    const query = req.query;
    const page = query.page;
    const limit = query.limit;
    const end = (page - 1) * limit;
    const allCupons = await Coupon.find()
      .populate("code")
      .limit(limit)
      .skip(end);
    if (!allCupons) {
      return next(new ErrorResponse("coupon not found", StatusCodes.NOT_FOUND));
    }
    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { allCupons },
      currentPage: page,
      coupons: limit,
    });
  } catch (error) {
    next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED));
  }
};
export const getVendorCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({
      vendor: req.user._id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { coupons },
    });
  } catch (error) {
    next(new ErrorResponse(error, StatusCodes.BAD_REQUEST));
  }
};
// add new cupon
// VENDOR can add new one
export const addCupon = async (req, res, next) => {
  try {
    const {
      code,
      type,
      value,
      minCartTotal,
      maxDiscount,
      expiryDate,
      usageLimit,
      usedCount,
      active,
    } = req.body;

    // Prepare coupon data
    const couponData = {
      code,
      type,
      value,
      minCartTotal,
      maxDiscount,
      expiryDate,
      usageLimit,
      usedCount,
      active,
    };

    // If user is a VENDOR, assign the coupon to them
    if (req.user.role === "VENDOR") {
      couponData.vendor = req.user._id;
    }

    const newCupon = await Coupon.create(couponData);

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      date: { newCupon },
    });
  } catch (error) {
    next(new ErrorResponse(error, StatusCodes.BAD_REQUEST));
  }
};
// get cupon by id
// admin can get spacific coupon
export const getCuponById = async (req, res, next) => {
  try {
    const cuponId = req.params.id;
    const cupon = await Coupon.findById(cuponId);
    if (!cupon) {
      return next(new ErrorResponse("Coupon not found", StatusCodes.NOT_FOUND));
    }
    res
      .status(StatusCodes.OK)
      .json({ status: httpStatus.SUCCESS, data: { cupon } });
  } catch (error) {
    next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED));
  }
};
//update by vendor
export const updateCouponByVendor = async (req, res, next) => {
  // Check if user is a VENDOR
  try {
    const couponCode = req.params.code; // Using code instead of id
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.vendor; // Prevent changing ownership

    // Find the coupon by code first to check ownership
    const coupon = await Coupon.findOne({ code: couponCode, isDeleted: false });

    if (!coupon) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: httpStatus.ERROR,
        data: { message: "No Coupon found to update" },
      });
    }

    // Check if the coupon belongs to the requesting vendor
    if (coupon.vendor.toString() !== req.user._id.toString()) {
      return next(
        new ErrorResponse(
          "Unauthorized: You can only update your own coupons",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    // If updating the code, check if new code already exists
    if (updates.code && updates.code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({
        code: updates.code.toUpperCase(),
        _id: { $ne: coupon._id },
      });

      if (existingCoupon) {
        return next(
          new ErrorResponse("Coupon code already exists", StatusCodes.CONFLICT)
        );
      }
    }

    // Update the coupon
    const updatedCoupon = await Coupon.findOneAndUpdate(
      { code: couponCode, vendor: req.user._id },
      updates,
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validations
      }
    );

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: {
        message: "Coupon updated successfully",
        coupon: updatedCoupon,
      },
    });
  } catch (error) {
    next(new ErrorResponse(error, StatusCodes.BAD_REQUEST));
  }
};
// update coupon by the vendor
export const updateCoupon = async (req, res, next) => {
  try {
    const cuponId = req.params.id;
    const updatedcoupon = await Coupon.findByIdAndUpdate(
      cuponId,
      { $set: { ...req.body } },
      { new: true }
    );
    if (!updateCoupon) {
      return next(new ErrorResponse("coupon not fiund", StatusCodes.NOT_FOUND));
    }
    res
      .status(StatusCodes.OK)
      .json({ status: httpStatus.SUCCESS, data: { updatedcoupon } });
  } catch (error) {
    next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED));
  }
};
// delete coupon (Admin , vendor)
export const deleteCoupon = async (req, res, next) => {
  if (!req.user.role || req.user.role !== "ADMIN") {
    return next(
      new ErrorResponse("Unauthorized user", StatusCodes.UNAUTHORIZED)
    );
  }
  try {
    const cuponId = req.params.id;
    const deletedCoupon = await Coupon.findByIdAndDelete(cuponId);
    if (!deletedCoupon) {
      return next(new ErrorResponse("Coupon Not Found", StatusCodes.NOT_FOUND));
    }
    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { message: "Coupon deleted Succefully" },
    });
  } catch (error) {
    next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED));
  }
};
//delete coupon by vendor
export const deleteCouponByVendor = async (req, res, next) => {
  // Check if user is a VENDOR

  try {
    const couponCode = req.params.code; // Using code instead of id

    // Find the coupon by code first to check ownership
    const coupon = await Coupon.findOne({ code: couponCode });

    if (!coupon) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: httpStatus.ERROR,
        data: { message: "No Coupon found to delete" },
      });
    }

    // Check if the coupon belongs to the requesting vendor
    if (coupon.vendor.toString() !== req.user._id.toString()) {
      return next(
        new ErrorResponse(
          "Unauthorized: You can only delete your own coupons",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    // Delete the coupon
    const deletedCoupon = await Coupon.findOneAndDelete({ code: couponCode });

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { message: "Coupon deleted successfully" },
    });
  } catch (error) {
    next(new ErrorResponse(error, StatusCodes.BAD_REQUEST));
  }
};
