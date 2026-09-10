// import multer from "multer";
// import { v2 as cloudinary } from "cloudinary";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import dotenv from "dotenv";

// dotenv.config();

// /**
//  * Configure Cloudinary with credentials from environment variables.
//  */
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// /**
//  * CloudinaryStorage configuration for multer.
//  * - Uploads images to the "herfy" folder in Cloudinary.
//  * - Accepts only jpg, jpeg, png, gif formats.
//  * - Resizes images to a max width/height of 800px while preserving aspect ratio.
//  */
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "herfy",
//     allowed_formats: ["jpg", "jpeg", "png", "gif"],
//     transformation: [{ width: 800, height: 800, crop: "limit" }],
//   },
// });

// /**
//  * Multer file filter middleware.
//  * - Allows only image MIME types: jpeg, jpg, png, gif.
//  * - Rejects any other file type with an error.
//  *
//  * @param {import('express').Request} req - Express request object
//  * @param {import('multer').File} file - Uploaded file object
//  * @param {Function} cb - Callback function to accept/reject the file
//  */
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
//   if (file && allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only image files are allowed!"));
//   }
// };

// /**
//  * Multer middleware configured with Cloudinary storage, file filter, and size limit (5MB).
//  */
// const uploadCloudinary = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
// });

// export {uploadCloudinary};
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
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

const UPLOAD_OPTIONS = {
  folder: "herfy",
  allowed_formats: ["jpg", "jpeg", "png", "gif"],
  transformation: [{ width: 800, height: 800, crop: "limit" }],
};

/**
 * Multer storage engine that streams straight to Cloudinary.
 *
 * Replaces multer-storage-cloudinary, which was pinned at 2.x: that release
 * targets the cloudinary v1 SDK, exports nothing this file could import, and
 * took its options flat rather than nested under `params`. The engine it
 * produced never invoked its own callback, so any request carrying an image
 * hung until the platform killed it. Upgrading is not an option either --
 * 4.x declares a peer of cloudinary@^1 and this project is on v2.
 *
 * Sets `path` to the secure URL and `filename` to the public id, which is what
 * the controllers and the product service read off the uploaded file.
 */
const storage = {
  _handleFile(req, file, cb) {
    const upload = cloudinary.uploader.upload_stream(
      UPLOAD_OPTIONS,
      (error, result) => {
        if (error) return cb(error);
        cb(null, {
          path: result.secure_url,
          filename: result.public_id,
          size: result.bytes,
          mimetype: file.mimetype,
        });
      },
    );
    file.stream.on("error", cb);
    file.stream.pipe(upload);
  },

  // multer calls this to undo an upload when a later file in the request fails
  _removeFile(req, file, cb) {
    if (!file.filename) return cb(null);
    cloudinary.uploader
      .destroy(file.filename)
      .then(() => cb(null))
      .catch(cb);
  },
};

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

export { uploadCloudinary };
