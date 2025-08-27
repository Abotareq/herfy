import mongoose from 'mongoose';
import Review from '../models/reviewModel.js';
import StatusCodes from '../utils/status.codes.js';
import httpStatus from '../utils/http.status.message.js'
import userRole from '../utils/user.role.js';
import ErrorResponse from '../utils/error-model.js';

// add review 
//handle entity id 

export const addNewReview = async (req, res, next) => {
  try {
    // Get user ID from req.user (set by requireAuth middleware)
    const userId = req.user?._id;
    if (!userId) {
      return next(new ErrorResponse("User not authenticated", StatusCodes.UNAUTHORIZED));
    }

    const { entityId, entityType, rating, comment } = req.body;

    // Validate required fields
    if (!entityId || !entityType || !rating) {
      return next(
        new ErrorResponse("entityId, entityType, and rating are required", StatusCodes.BAD_REQUEST)
      );
    }

    // Validate rating (1-5)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return next(new ErrorResponse("Rating must be an integer between 1 and 5", StatusCodes.BAD_REQUEST));
    }

    // Validate entityType
    const validEntityTypes = ["Product", "store"];
    if (!validEntityTypes.includes(entityType)) {
      return next(
        new ErrorResponse("entityType must be 'Product' or 'store'", StatusCodes.BAD_REQUEST)
      );
    }

    // Create the review
    const review = await Review.create({
      user: userId,
      entityId,
      entityType,
      rating,
      comment: comment || "", // Allow empty comments
    });

    // Populate user details for response
    const populatedReview = await Review.findById(review._id).populate("user");

    res.status(StatusCodes.CREATED).json({
      status: httpStatus.SUCCESS,
      data: populatedReview,
    });
  } catch (error) {
    next(new ErrorResponse(error.message || "Server error", StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
// get all reviews
// export const getAllReviews = async(req, res, next) => {
//     const query = req.query;
//     const page = query.page;
//     const limit = query.limit;
//     const end = (page - 1) * limit
//     try {
//         const allReviews =await Review.find().populate('comment').limit(limit).skip(end);
//         if(!allReviews){
//             return next(new ErrorResponse('No review found', StatusCodes.NOT_FOUND));
//         }
//         res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {allReviews}});
//     } catch (error) {
//       next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED));
//     }
// }

export const getAllReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const pipeline = [
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'entityId',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $lookup: {
          from: 'stores',
          localField: 'entityId',
          foreignField: '_id',
          as: 'store',
        },
      },
      {
        $addFields: {
          entity: { $ifNull: [{ $first: '$product' }, { $first: '$store' }] },
          user: { $first: '$user' },
        },
      },
      {
        $project: {
          product: 0,
          store: 0,
          'user.password': 0,
          'user.passwordResetToken': 0,
          'user.passwordResetExpires': 0,
        },
      },
    ];

    const allReviews = await Review.aggregate(pipeline);
    const totalReviews = await Review.countDocuments();
    const totalPages = Math.ceil(totalReviews / limit);

    if (!allReviews.length) {
      return next(new ErrorResponse('No reviews found', StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      results: allReviews.length,
      pagination: {
        totalReviews,
        totalPages,
        currentPage: page,
      },
      data: { allReviews },
    });
  } catch (error) {
    console.error("Get Reviews Error:", error.message);
    next(new ErrorResponse("Failed to fetch reviews", StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// ==========================
// Update review by user for specific entity
// ==========================
export const updateReviews = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ErrorResponse("Unauthorized access", StatusCodes.UNAUTHORIZED));
    }

    const { entityId, entityType, rating, comment } = req.body;

    const updatedReview = await Review.findOneAndUpdate(
      {
        user: req.user._id,
        entityId,
        entityType,
      },
      { rating, comment },
      { new: true }
    );

    if (!updatedReview) {
      return next(new ErrorResponse("Review not found or not authorized", StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { updatedReview },
    });

  } catch (error) {
    console.error("Update Review Error:", error.message);
    next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// ==========================
// Delete review by user for specific entity
// ==========================
// export const deleteReview = async (req, res, next) => {
//   try {
//     if (!req.user) {
//       return next(new ErrorResponse("Unauthorized user", StatusCodes.UNAUTHORIZED));
//     }

//     const { entityId, entityType } = req.body;

//     const deletedReview = await Review.findOneAndDelete({
//       user: req.user._id,
//       entityId,
//       entityType,
//     });

//     if (!deletedReview) {
//       return next(new ErrorResponse("Review not found", StatusCodes.NOT_FOUND));
//     }

//     res.status(StatusCodes.OK).json({
//       status: httpStatus.SUCCESS,
//       data: { message: 'Review deleted successfully' },
//     });

//   } catch (error) {
//     console.error("Delete Review Error:", error.message);
//     next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
//   }
// };

//*! osama saad
// ==========================
// Delete review by user for specific entity  //osama
// ==========================
export const deleteReview = async (req, res, next) => {
  try {
    const { entityId, entityType } = req.query;
    const userId = req.user._id;
    if (!entityId || !entityType) {
      return next(
        new ErrorResponse(
          'entityId and entityType are required query parameters.',
          StatusCodes.BAD_REQUEST
        )
      );
    }
    const deletedReview = await Review.findOneAndDelete({
      user: userId,
      entityId: entityId,
      entityType: entityType,
    });
    if (!deletedReview) {
      return next(
        new ErrorResponse(
          'Review not found or you are not authorized to delete it.',
          StatusCodes.NOT_FOUND
        )
      );
    }
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// ==========================
// Delete review by admin  
// ==========================

export const deleteReviewByAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return next(new ErrorResponse("Unauthorized admin", StatusCodes.UNAUTHORIZED));
    }

    const reviewID = req.params.id;
    const deletedReview = await Review.findByIdAndDelete(reviewID);

    if (!deletedReview) {
      return next(new ErrorResponse("No review found", StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { message: 'Review deleted successfully by admin' },
    });

  } catch (error) {
    console.error("Admin Delete Error:", error.message);
    next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

// ==========================
// Review Summary Aggregation
// ==========================
export const getReviewSummary_DBOnly = async (entityId, entityType) => {
  const stats = await Review.aggregate([
    {
      $match: {
        entityId: new mongoose.Types.ObjectId(entityId),
        entityType: entityType
      }
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    },
    {
      $group: {
        _id: null,
        ratings: { $push: { rating: '$_id', count: '$count' } },
        totalReviews: { $sum: '$count' },
        totalScore: { $sum: { $multiply: ['$_id', '$count'] } }
      }
    },
    {
      $project: {
        _id: 0,
        totalReviews: 1,
        averageRating: {
          $cond: [
            { $eq: ['$totalReviews', 0] },
            0,
            { $round: [{ $divide: ['$totalScore', '$totalReviews'] }, 1] }
          ]
        },
        ratings: {
          $map: {
            input: '$ratings',
            as: 'r',
            in: {
              rating: '$$r.rating',
              count: '$$r.count',
              percentage: {
                $round: [
                  { $multiply: [{ $divide: ['$$r.count', '$totalReviews'] }, 100] },
                  0
                ]
              }
            }
          }
        }
      }
    }
  ]);

  return stats[0] || {
    totalReviews: 0,
    averageRating: 0,
    ratings: [
      { rating: 5, count: 0, percentage: 0 },
      { rating: 4, count: 0, percentage: 0 },
      { rating: 3, count: 0, percentage: 0 },
      { rating: 2, count: 0, percentage: 0 },
      { rating: 1, count: 0, percentage: 0 }
    ]
  };
};

// ==========================
// Review Summary API Route
// ==========================
export const getReviewSummaryRoute = async (req, res, next) => {
  try {
    const { entityId, entityType } = req.params;
    const summary = await getReviewSummary_DBOnly(entityId, entityType);
    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: summary
    });
  } catch (error) {
    console.error("Review Summary Error:", error.message);
    next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};
export const getUserReviews = async (req, res, next) => {
  try {
    // Get userId from req.user (set by authentication middleware)
    const userId = req.user?._id || req.user?.id; // Handle both _id and id cases
    if (!userId) {
      return next(new ErrorResponse("User not authenticated", StatusCodes.UNAUTHORIZED));
    }

    const { page = 1, limit = 10, entityType, sortBy = "createdAt", order = "desc" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: userId };
    if (entityType && entityType !== "all") {
      filter.entityType = entityType;
    }

    const sort = {};
    sort[sortBy] = order === "desc" ? -1 : 1;

    const reviews = await Review.find(filter)
      .populate("user") // Populate user details (e.g., name)
      .populate("entityId") // Populate entity details (e.g., product/store name, slug, images)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const totalReviews = await Review.countDocuments(filter);

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: {
        reviews,
        pagination: {
          totalReviews,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(new ErrorResponse(error.message || "Server error", StatusCodes.INTERNAL_SERVER_ERROR));
  }
};


//*! osama
// ==========================
// Review by user   
// ==========================
export const getReviewsByUserId = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const reviews = await Review.find({ user: userId }).populate('entityId'); // Populate entity details

    if (!reviews || reviews.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: httpStatus.FAIL,
        data: { message: "No reviews found for this user" },
      });
    }

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { reviews },
    });
  } catch (error) {
    next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

