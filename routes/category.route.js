import {getAllCategoty, 
        addNewCategory,
        getCategotyById,
        deleteCategory } from "../controllers/category.controller.js";
import express from 'express';
const categoryRouter = express.Router();
import multer from 'multer';
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

categoryRouter.get('/', getAllCategoty)
categoryRouter.get('/:id', getCategotyById)
categoryRouter.delete('/:id', deleteCategory)
categoryRouter.post('/', upload.single('image'),addNewCategory)
export default categoryRouter;