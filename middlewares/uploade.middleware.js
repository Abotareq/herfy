import multer from "multer";
import path from "path";

/**
 * Multer storage configuration:
 * - Saves uploaded files to "uploads/" directory.
 * - Filenames are prepended with a timestamp to ensure uniqueness.
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

/**
 * File filter to allow only specific image types:
 * - Accepts: jpeg, jpg, png, gif files.
 * - Checks both MIME type and file extension.
 * - Rejects files with other types.
 *
 * @param {Express.Request} req - The express request object.
 * @param {Express.Multer.File} file - The file to be uploaded.
 * @param {Function} cb - Callback to indicate if file is accepted or rejected.
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
  const extname = [".jpeg", ".jpg", ".png", ".gif"].includes(
    path.extname(file.originalname).toLowerCase()
  );

  if (file && allowedTypes.includes(file.mimetype) && extname) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

/**
 * Multer middleware instance configured with:
 * - Storage settings (destination + filename)
 * - File filter for image types
 * - File size limit of 5 MB
 */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

export default upload;
