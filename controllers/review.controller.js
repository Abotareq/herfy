import mongoose from 'mongoose';
import Review from '../models/reviewModel.js';
import StatusCodes from '../utils/status.codes.js';
import httpStatus from '../utils/http.status.message.js'
import userRole from '../utils/user.role.js';

// add review 
//handle entity id 
export const addNewReview = async(req, res, next) => {
    try {
        const { entityType, rating, comment} = req.body;
        const addReview =await Review.create({
            entityType,
            rating,
            comment,
        })
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {addReview}});
        
        // add 
    } catch (error) {
      next(next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED)));
    }
}
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
export const deleteReview = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ErrorResponse("Unauthorized user", StatusCodes.UNAUTHORIZED));
    }

    const { entityId, entityType } = req.body;

    const deletedReview = await Review.findOneAndDelete({
      user: req.user._id,
      entityId,
      entityType,
    });

    if (!deletedReview) {
      return next(new ErrorResponse("Review not found", StatusCodes.NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      status: httpStatus.SUCCESS,
      data: { message: 'Review deleted successfully' },
    });

  } catch (error) {
    console.error("Delete Review Error:", error.message);
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
