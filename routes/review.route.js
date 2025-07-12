import express from 'express';
import {addNewReview, getAllReviews, updateReviews, deleteReview, deleteReviewByAdmin} from '../controllers/review.controller.js';
import { checkRole,requireAuth } from '../auth/auth.middleware.js';
import userRole from '../utils/user.role.js';
const reviewRouter = express.Router();
reviewRouter.post('/', requireAuth,checkRole([userRole.CUSTOMER]), addNewReview);
reviewRouter.get('/',requireAuth,checkRole([userRole.ADMIN]),  getAllReviews);
reviewRouter.patch('/:id',requireAuth,checkRole([userRole.CUSTOMER]),  updateReviews);
reviewRouter.delete('/:id', requireAuth,checkRole([userRole.VENDOR, userRole.CUSTOMER]), deleteReview);
reviewRouter.delete('/:id', requireAuth,checkRole([userRole.ADMIN]), deleteReviewByAdmin);
// reviewRouter.delete('/:id', requireAuth, checkRole([userRole.ADMIN]),deletUserByUser)
//REVIEW FOR CERTAIN PRODUCT OR CERTAIN STORE
export default reviewRouter
// create delete review by user only and one by admin
// filter review for products and shops