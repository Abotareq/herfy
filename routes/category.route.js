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

// create folder to hold photos in
const discStorage = multer.diskStorage({
        destination: function (req, file, cb){
                cb(null, 'uploads/Category')
        },
        filename: function(req, file, cb){
                const ext = file.mimetype.split('/')[1];
                const fileName = `category-${Date.now()}.${ext}`;
                cb(null, fileName)
        }
})
const fileType = (req, file, cb) => {
        const imageType = file.mimetype.split('/')[1]
        const allowedExt = ['jpg','png','jpeg'];
        if(allowedExt.includes(imageType)){
                return cb(null, true)
        }else{
                return cb(new Error('Only .jpg, .jpeg, and .png files are allowed!'), false)
        }
}
const upload = multer({storage: discStorage,
        fileFilter: fileType
})
categoryRouter.get('/filter', requireAuth, filterCategoryByName)
categoryRouter.get('/search',requireAuth, searchCategoryByName);

categoryRouter.get('/',requireAuth ,getAllCategoty)
categoryRouter.get('/:id',requireAuth,checkRole([userRole.ADMIN]), getCategotyById)
categoryRouter.delete('/:id',requireAuth,checkRole([userRole.ADMIN]),  deleteCategory)
categoryRouter.post('/', upload.single('image'),requireAuth,checkRole([userRole.ADMIN]),addNewCategory)
// any one can search category
categoryRouter.patch('/:id',requireAuth,checkRole([userRole.ADMIN]), UpdateCategory)
export default categoryRouter;
//UPDATE CATEGORY BY ID "ADMIN" ADD TO YOUR ALL ROUTERS ERROR MIDDLE WARE LOOK FOR AUTH CONTROLLER FOR REFERNCE.
// search and filter by name