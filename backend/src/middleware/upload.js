const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');

const dir = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, dir),
  filename: (_, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});
