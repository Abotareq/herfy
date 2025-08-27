import {getAllCategoty, 
        addNewCategory,
        getCategotyById,
        deleteCategory, 
        UpdateCategory} from "../controllers/category.controller.js";
import express from 'express';
import { requireAuth,checkRole } from "../auth/auth.middleware.js";
const categoryRouter = express.Router();
import multer from 'multer';
import userRole from "../utils/user.role.js";
import { searchCategoryByName } from "../controllers/search.controller.js";
import { filterCategoryByName } from "../controllers/filter.controller.js";
import upload from "../middlewares/uploade.middleware.js";
import { uploadCloudinary } from "../middlewares/cloudinary.middleware.js";
// categoryRouter.get('/filter', requireAuth, filterCategoryByName)
// categoryRouter.get('/search',requireAuth, searchCategoryByName);

// categoryRouter.get('/',requireAuth ,getAllCategoty)
// categoryRouter.get('/:id',requireAuth,checkRole([userRole.ADMIN]), getCategotyById)
// categoryRouter.delete('/:id',requireAuth,checkRole([userRole.ADMIN]),  deleteCategory)

//  categoryRouter.post('/', upload.single("image"),requireAuth,checkRole([userRole.ADMIN]),addNewCategory)
// any one can search category
// categoryRouter.patch('/:id',requireAuth,checkRole([userRole.ADMIN]), UpdateCategory)
export default categoryRouter;
categoryRouter.get('/filter', filterCategoryByName)
categoryRouter.get('/search', searchCategoryByName);
categoryRouter.post('/', requireAuth,checkRole([userRole.ADMIN]),uploadCloudinary.single("image"),addNewCategory)
categoryRouter.get('/',getAllCategoty)
categoryRouter.get('/:id', getCategotyById)
categoryRouter.delete('/:id', requireAuth, checkRole([userRole.ADMIN]), deleteCategory)

// categoryRouter.post('/', upload.single("image"),requireAuth,checkRole([userRole.ADMIN]),addNewCategory)
// any one can search category
categoryRouter.patch('/:id', requireAuth, checkRole([userRole.ADMIN]), uploadCloudinary.single("image"), UpdateCategory)

//UPDATE CATEGORY BY ID "ADMIN" ADD TO YOUR ALL ROUTERS ERROR MIDDLE WARE LOOK FOR AUTH CONTROLLER FOR REFERNCE.
// search and filter by name