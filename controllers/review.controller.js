import StatusCodes from '../utils/status.codes.js';
import httpStatus from '../utils/http.status.message.js'
import Review from '../models/reviewModel.js';
import userRole from '../utils/user.role.js';
import mongoose from 'mongoose';
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
export const getAllReviews = async(req, res, next) => {
    const query = req.query;
    const page = query.page;
    const limit = query.limit;
    const end = (page - 1) * limit
    try {
        const allReviews =await Review.find().populate('comment').limit(limit).skip(end);
        if(!allReviews){
            return next(new ErrorResponse('No review found', StatusCodes.NOT_FOUND));
        }
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {allReviews}});
    } catch (error) {
      next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED));
    }
}
// update review
export const updateReviews = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ErrorResponse("Unauthorized access", StatusCodes.UNAUTHORIZED));
    }

    const updatedReview = await Review.findOneAndUpdate(
      { user: req.user._id },
      { $set: { ...req.body } },
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
    next(new ErrorResponse(error.message, StatusCodes.INTERNAL_SERVER_ERROR));
  }
}

export const deleteReview = async (req, res, next) => {
    try {
        if(!req.user){
            return next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED))
        }
        
        const deletedReview = await Review.findOneAndDelete({user: req.user._id});
        if(!deletedReview){
            return next(new ErrorResponse(error, StatusCodes.NOT_FOUND));
        }
        res.status(StatusCodes.OK).json({status:httpStatus.SUCCESS, data: {message: 'Review deleted Succefully'}});
    } catch (error) {
      next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED));
    }
}
// delete review by admin
export const deleteReviewByAdmin = async(req, res, next) => {
    if(!req.user){
        return next(new ErrorResponse('Unauthorized User', StatusCodes.UNAUTHORIZED));
    }
    try {
        const reviewID = req.params.id;
        const deletedReview = await Review.findByIdAndDelete(reviewID);
        if(!deletedReview){
            return next(new ErrorResponse('No Review Found', StatusCodes.NOT_FOUND)); 
        }
        res.status(StatusCodes.OK).json({status:httpStatus.SUCCESS, data: {message: 'Review deleted Succefully'}});
    } catch (error) {
        next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED));
    }
}


// Added by Osama Saad

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



  //  لو مفيش تقييمات هنرجع داتا فاضية

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

export const getReviewSummaryRoute = async (req, res, next) => {
  try {
    const { entityId, entityType } = req.params;
    const summary = await getReviewSummary_DBOnly(entityId, entityType);
    res.status(200).json({ status: 'success', data: summary });
  } catch (error) {
    next(error);
  }
};





// export const deletUserByUser = async (req, res, next) => {
//     if (!req.user.role || req.user.role !== userRole.CUSTOMER){
//         res.json(StatusCodes.UNAUTHORIZED).json({data: {message: 'UNAUTHORIZED User'}});
//     }
//     try {
//         const customerId = req.params.id;
//         const userReview = await Review.findByIdAndDelete(customerId);
//         if(!userReview){
//             res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.FAIL, data: {message: 'No review exists'}});
//         }
//         res.status(StatusCodes.OK).json({status:httpStatus.SUCCESS, data: {message: 'Review deleted Succefully'}});
//     } catch (error) {
//         next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED));
//     }
// }