const multer = require("multer");
const path = require("path");

const fileUpload = ({ storagePath, allowedTypes, maxSize }) => {

  return multer({

    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, storagePath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        const filename = uniqueSuffix + fileExt;
        cb(null, filename);
      }
    }),

    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!Array.isArray(allowedTypes) || !allowedTypes.includes(ext)) {
        cb(new Error(`Only ${Array.isArray(allowedTypes) ? allowedTypes.join(', ') : ''} file types are allowed`), false);
        return;
      }
      cb(null, true);
    },

    limits: {
      fileSize: maxSize
    }
  });
};

module.exports = fileUpload;
