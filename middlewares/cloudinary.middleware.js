import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

/**
 * Configure Cloudinary with credentials from environment variables.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * CloudinaryStorage configuration for multer.
 * - Uploads images to the "herfy" folder in Cloudinary.
 * - Accepts only jpg, jpeg, png, gif formats.
 * - Resizes images to a max width/height of 800px while preserving aspect ratio.
 */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "herfy",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  },
});

/**
 * Multer file filter middleware.
 * - Allows only image MIME types: jpeg, jpg, png, gif.
 * - Rejects any other file type with an error.
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('multer').File} file - Uploaded file object
 * @param {Function} cb - Callback function to accept/reject the file
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
  if (file && allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

/**
 * Multer middleware configured with Cloudinary storage, file filter, and size limit (5MB).
 */
const uploadCloudinary = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export {uploadCloudinary};
