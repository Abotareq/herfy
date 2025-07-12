import {getAllCupons, addCupon, getCuponById, updateCoupon,deleteCoupon, deleteCouponByVendor} from '../controllers/cupon.controller.js';
import express from 'express';
import { requireAuth,checkRole } from '../auth/auth.middleware.js';
import userRole from '../utils/user.role.js';
import { searchCouponByCode } from '../controllers/search.controller.js';
import { filterCouponByActive } from '../controllers/filter.controller.js';
const couponRouter = express.Router();

couponRouter.get('/',requireAuth,checkRole([userRole.ADMIN,userRole.VENDOR]), getAllCupons);
couponRouter.get('/:id',requireAuth,checkRole([userRole.ADMIN]), getCuponById);
couponRouter.post('/',requireAuth,checkRole([userRole.ADMIN,userRole.VENDOR]),  addCupon);
couponRouter.patch('/:id',requireAuth,checkRole([userRole.ADMIN,userRole.VENDOR]),  updateCoupon);
couponRouter.delete('/:id',requireAuth,checkRole([userRole.ADMIN]),  deleteCoupon);
couponRouter.delete('/:code',requireAuth,checkRole([userRole.VENDOR]),  deleteCouponByVendor);
couponRouter.get('/search', requireAuth, searchCouponByCode);
couponRouter.get('/filter', requireAuth, filterCouponByActive)
export default couponRouter;
// search by coupon code 
// filter by active