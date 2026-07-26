const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const env = require('../config/env');

const dir = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Allowed MIME types for uploads
const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

// Allowed file extensions
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.pdf',
]);

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, dir),
  filename: (_, file, cb) => {
    // Generate a UUID-based filename to prevent path traversal and collisions
    const ext = path.extname(file.originalname).toLowerCase();
    const uuid = crypto.randomUUID();
    cb(null, uuid + ext);
  },
});

module.exports = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB (down from 25 MB)
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // Reject executables and unknown types
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error(`File type ${ext} is not allowed. Allowed: JPG, JPEG, PNG, WEBP, PDF`));
    }

    // Verify MIME type
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      return cb(new Error(`MIME type ${file.mimetype} is not allowed`));
    }

    cb(null, true);
  },
});
