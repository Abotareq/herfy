import {getAllCupons, addCupon, getCuponById, updateCoupon,deleteCoupon} from '../controllers/cupon.controller.js';
import express from 'express';

const couponRouter = express.Router();

couponRouter.get('/', getAllCupons);
couponRouter.get('/:id', getCuponById);
couponRouter.post('/', addCupon);
couponRouter.patch('/:id', updateCoupon);
couponRouter.delete('/:id', deleteCoupon);
export default couponRouter;