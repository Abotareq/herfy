import {getAllUsers, getUserById, updateUser} from '../controllers/user.controller.js';
import express  from 'express';

const userRouter = express.Router();

userRouter.get('/', getAllUsers);
userRouter.get('/:id', getUserById);
userRouter.post('/:id', updateUser)
export default userRouter;