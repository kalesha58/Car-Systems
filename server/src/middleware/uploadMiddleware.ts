import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { IMulterFile } from './authMiddleware';

const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Configure storage based on environment
// Use memory storage for serverless (Vercel, AWS Lambda) to avoid filesystem issues
// Use disk storage for local development
let storage: multer.StorageEngine;

if (isServerless) {
  // Memory storage for serverless environments
  storage = multer.memoryStorage();
} else {
  // Disk storage for local development
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  });
}

// File filter
const fileFilter = (req: any, file: IMulterFile, cb: multer.FileFilterCallback) => {
  // Accept only images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Single image upload middleware
export const uploadSingle = upload.single('image');

// Multiple images upload middleware
export const uploadMultiple = upload.array('images', 10); // Max 10 images

