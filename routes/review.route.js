import express from 'express';
import {addNewReview, getAllReviews, updateReviews, deleteReview} from '../controllers/review.controller.js';

const reviewRouter = express.Router();
reviewRouter.post('/', addNewReview);
reviewRouter.get('/', getAllReviews);
reviewRouter.patch('/:id', updateReviews);
reviewRouter.delete('/:id', deleteReview);

export default reviewRouter