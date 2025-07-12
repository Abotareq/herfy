import StatusCodes from '../utils/status.codes.js';
import httpStatus from '../utils/http.status.message.js'
import Review from '../models/reviewModel.js';
import userRole from '../utils/user.role.js';
// add review 
export const addNewReview = async(req, res, next) => {
    try {
        const { entityType, rating, comment} = req.body;
        const addReview =await Review.create({
            entityType,
            rating,
            comment,
        })
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {addReview}});
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
            res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.FAIL, data: {message: 'No Reviews found for that product'}});
        }
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {allReviews}});
    } catch (error) {
      next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED));
    }
}
// update review
export const updateReviews = async(req, res, next) => {
    try {
        const reviewId = req.params.id;
        const updatedReview = await Review.findById(reviewId, {$set: {...req.body}}, {new: true});
        if(!updatedReview){
            res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.FAIL, data: {message: "can't updated the review"}});
        }
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {updatedReview}});
    } catch (error) {
      next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED));
    }
}
export const deleteReview = async (req, res, next) => {
    try {
        const deleteId = req.params.id;
        const deletedReview = await Review.findByIdAndDelete(deleteId);
        if(!deletedReview){
            res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.FAIL, data: {message: 'No review exists'}});
        }
        res.status(StatusCodes.OK).json({status:httpStatus.SUCCESS, data: {message: 'Review deleted Succefully'}});
    } catch (error) {
      next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED));
    }
}
// delete review by admin
export const deleteReviewByAdmin = async(req, res, next) => {
    if(!req.user.role || req.user.role !== userRole.ADMIN){
        res.json(StatusCodes.UNAUTHORIZED).json({data: {message: 'UNAUTHORIZED User'}});
    }
    try {
        const reviewID = req.params.id;
        const newReview = await Review.findByIdAndDelete(reviewID);
        if(!newReview){
            res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.FAIL, data: {message: 'No review exists'}});
        }
        res.status(StatusCodes.OK).json({status:httpStatus.SUCCESS, data: {message: 'Review deleted Succefully'}});
    } catch (error) {
        next(new ErrorResponse(error, StatusCodes.UNAUTHORIZED));
    }
}
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