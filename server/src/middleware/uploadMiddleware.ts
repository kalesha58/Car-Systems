import multer from 'multer';
import { IMulterFile } from './authMiddleware';

const storage = multer.memoryStorage();

// File filter
const fileFilter = (_req: Express.Request, file: IMulterFile, cb: multer.FileFilterCallback) => {
  // Accept images and PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only image and PDF files are allowed'));
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Single image upload middleware
export const uploadSingle = upload.single('image');

// Single file upload middleware (for documents - images or PDFs)
export const uploadFile = upload.single('file');

// Multiple images upload middleware
export const uploadMultiple = upload.array('images', 10); // Max 10 images

