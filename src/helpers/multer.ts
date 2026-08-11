import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = "uploads/";
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
  
  export const upload = multer({ storage });