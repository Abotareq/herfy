// filter category by name
// filter coupon by active
// filter review for products and shops
import httpStatus from "../utils/http.status.message.js";
import StatusCodes from "../utils/status.codes.js";
import Category from "../models/categoryModel.js";
import Coupon from "../models/cuponModel.js";
import Review from "../models/reviewModel.js";
import Product from '../models/productModel.js';  
import Store from '../models/storeModel.js';     
import ErrorResponse from "../utils/error-model.js";
import mongoose from "mongoose";

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
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: httpStatus.ERROR,
      data: { message: "missing query parameter" },
    });
  }
  try {
    const filter = { isActive: isActive === "true" };
    const result = Coupon.find(filter);
    if (!result) {
      return res.status(StatusCodes.NOT_FOUND).json({
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

//*! osama

// export const filterReviewByUser = async (req, res, next) => {
//   try {
//     const { userId } = req.params;
//     if (!userId) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         status: httpStatus.ERROR,
//         data: { message: "User ID is required" },
//       });
//     }

//     const { page = 1, limit = 10 } = req.query;
//     const skip = (parseInt(page) - 1) * parseInt(limit); // Using an aggregation pipeline 

//     const pipeline = [
//       { $match: { user: new mongoose.Types.ObjectId(userId) } },
//       { $sort: { createdAt: -1 } },
//       { $skip: skip },
//       { $limit: parseInt(limit) },
//       {
//         $lookup: {
//           from: "products",
//           localField: "entityId",
//           foreignField: "_id",
//           as: "productDetails",
//         },
//       },
//       {
//         $lookup: {
//           from: "stores",
//           localField: "entityId",
//           foreignField: "_id",
//           as: "storeDetails",
//         },
//       },
//       {
//         $addFields: {
//           entityDetails: {
//             $ifNull: [
//               { $arrayElemAt: ["$productDetails", 0] },
//               { $arrayElemAt: ["$storeDetails", 0] },
//             ],
//           },
//         },
//       },
//       {
//         $project: {
//           productDetails: 0,
//           storeDetails: 0,
//           "entityDetails.reviews": 0,
//         },
//       },
//     ];

//     const reviews = await Review.aggregate(pipeline);

//     res.status(StatusCodes.OK).json({
//       status: httpStatus.SUCCESS,
//       data: { reviews },
//     });
//   } catch (error) {
//     next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
//   }
// };


// export const filterReviews = async (req, res, next) => {
//   try {
//     const { userId, entityType, sortBy, order = 'desc', page = 1, limit = 10 } = req.query;

//     const matchStage = {};
//     if (userId) {
//       matchStage.user = new mongoose.Types.ObjectId(userId);
//     }
//     if (entityType && entityType !== 'undefined') {
//       matchStage.entityType = new RegExp(`^${entityType}$`, 'i');
//     }

//     const sortStage = { [sortBy || 'createdAt']: order === 'asc' ? 1 : -1 };

//     const pipeline = [
//       { $match: matchStage },
//       { $sort: sortStage },
//       {
//         $lookup: {
//           from: 'products',
//           localField: 'entityId',
//           foreignField: '_id',
//           as: 'productDetails',
//         },
//       },
//       {
//         $lookup: {
//           from: 'stores',
//           localField: 'entityId',
//           foreignField: '_id',
//           as: 'storeDetails',
//         },
//       },
//       {
//         $addFields: {
//           entityDetails: {
//             $ifNull: [{ $first: '$productDetails' }, { $first: '$storeDetails' }],
//           },
//         },
//       },
//       {
//         $project: {
//           productDetails: 0,
//           storeDetails: 0,
//         },
//       },
//       {
//         $facet: {
//           metadata: [{ $count: 'totalReviews' }],
//           data: [{ $skip: (parseInt(page) - 1) * parseInt(limit) }, { $limit: parseInt(limit) }],
//         },
//       },
//     ];

//     const result = await Review.aggregate(pipeline);
    
//     const reviews = result[0].data;
//     const totalReviews = result[0].metadata[0]?.totalReviews || 0;
    
//     res.status(StatusCodes.OK).json({
//       status: "success",
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(totalReviews / parseInt(limit)),
//         totalReviews,
//       },
//       data: { reviews },
//     });

//   } catch (error) {
//     next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
//   }
// };


export const filterReviews = async (req, res, next) => {
  try {
    const { userId, entityType, sortBy, order = 'desc', page = 1, limit = 10 } = req.query;

    const matchStage = {};
    if (userId) {
      matchStage.user = new mongoose.Types.ObjectId(userId);
    }
    

    if (entityType && entityType !== 'undefined') {
      matchStage.entityType = new RegExp(`^${entityType}$`, 'i');
    }

    const sortStage = { [sortBy || 'createdAt']: order === 'asc' ? 1 : -1 };

    const pipeline = [
      { $match: matchStage },
      { $sort: sortStage },
      {

        $lookup: {

          from: Product.collection.name,
          localField: 'entityId',   
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      {
        $lookup: {
          from: Store.collection.name, 
          localField: 'entityId',
          foreignField: '_id',
          as: 'storeDetails',
        },
      },
      {
        $addFields: {
          entityDetails: {
            $ifNull: [{ $first: '$productDetails' }, { $first: '$storeDetails' }],
          },
        },
      },
      {

        $project: {
          productDetails: 0,
          storeDetails: 0,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'totalReviews' }],
          data: [{ $skip: (parseInt(page) - 1) * parseInt(limit) }, { $limit: parseInt(limit) }],
        },
      },
    ];

    const result = await Review.aggregate(pipeline);
    
    const reviews = result[0].data;
    const totalReviews = result[0].metadata[0]?.totalReviews || 0;
    

    if (reviews.length > 0 && !reviews[0].entityDetails) {
        console.log("DEBUG: The first review has no entityDetails. The lookup failed.");
        console.log("DEBUG: First review's entityId:", reviews[0].entityId);
    }

    res.status(StatusCodes.OK).json({
      status: "success",
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / parseInt(limit)),
        totalReviews,
      },
      data: { reviews },
    });

  } catch (error) {
    next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};