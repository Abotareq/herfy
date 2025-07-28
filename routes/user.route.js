import {deleteUserByAdmin, deleteUserByUser, getAllUsers, getUserById, updateByUser, updateUserByAdmin} from '../controllers/user.controller.js';
import express  from 'express';
import { checkRole,requireAuth } from '../auth/auth.middleware.js';
import userRole from '../utils/user.role.js';
import { searchByRoleByAdmin, searchUserByName} from '../controllers/search.controller.js';
const userRouter = express.Router();
userRouter.get('/searchUser', requireAuth, checkRole([userRole.ADMIN]), searchUserByName)
userRouter.get('/search',requireAuth, checkRole([userRole.ADMIN]), searchByRoleByAdmin)
userRouter.get('/', requireAuth,checkRole([userRole.ADMIN]), getAllUsers);
userRouter.get('/:id',requireAuth,checkRole([userRole.ADMIN]),  getUserById);
userRouter.patch('/', requireAuth,checkRole([userRole.CUSTOMER, userRole.VENDOR]), updateByUser);
userRouter.patch('/:id', requireAuth,checkRole([userRole.ADMIN]), updateUserByAdmin);
userRouter.delete('/:id', requireAuth,checkRole([userRole.ADMIN]), deleteUserByAdmin)
userRouter.delete('/', requireAuth, checkRole([userRole.CUSTOMER]), deleteUserByUser)
// userRouter.get('/search',requireAuth, checkRole([userRole.CUSTOMER, userRole.VENDOR]),searchRole)
export default userRouter;
//delete user by user
// search user by userName adminrole 
// searc for username of vendor 