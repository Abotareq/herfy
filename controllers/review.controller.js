import StatusCodes from '../utils/status.codes.js';
import httpStatus from '../utils/http.status.message.js'
import Review from '../models/reviewModel.js';
// add review 
export const addNewReview = async(req, res) => {
    try {
        const { entityType, rating, comment} = req.body;
        const addReview =await Review.create({
            entityType,
            rating,
            comment,
        })
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {addReview}});
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({status: httpStatus.ERROR, data: {message: error}})
    }
}
// get all reviews
export const getAllReviews = async(req, res) => {
    try {
        const allReviews =await Review.find();
        if(!allReviews){
            res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.FAIL, data: {message: 'No Reviews found for that product'}});
        }
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {allReviews}})
    } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).json({status: httpStatus.ERROR, data: {message: 'Unauthorized user'}})
    }
}
// update review
export const updateReviews = async(req, res) => {
    try {
        const reviewId = req.params.id;
        const updatedReview = await Review.findById(reviewId, {$set: {...req.body}}, {new: true});
        if(!updatedReview){
            res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.FAIL, data: {message: "can't updated the review"}})
        }
        res.status(StatusCodes.OK).json({status: httpStatus.SUCCESS, data: {updatedReview}})
    } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).json({status: httpStatus.ERROR, data: {message: 'Unauthorized user'}})
    }
}
export const deleteReview = async (req, res) => {
    try {
        const deleteId = req.params.id
        const deletedReview = await Review.findByIdAndDelete(deleteId);
        if(!deletedReview){
            res.status(StatusCodes.NOT_FOUND).json({status: httpStatus.FAIL, data: {message: 'error delete the review'}});
        }
        res.status(StatusCodes.OK).json({status:httpStatus.SUCCESS, data: {message: 'Review deleted Succefully'}})
    } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).json({status: httpStatus.ERROR, data: {message: 'Unauthorized user'}})
    }
}