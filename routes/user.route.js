import {deleteUser, getAllUsers, getUserById, updateUser} from '../controllers/user.controller.js';
import express  from 'express';

const userRouter = express.Router();

userRouter.get('/', getAllUsers);
userRouter.get('/:id', getUserById);
userRouter.post('/:id', updateUser);
userRouter.delete('/:id', deleteUser)
export default userRouter;