const fs = require('fs');

exports.photoRequiredIsImage = (req, res, next) => {
  if (req.file && !['image/jpeg', 'image/png', 'image/webp'].includes(req.file.mimetype)) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Photo must be a JPEG, PNG, or WebP image' });
  }
  next();
};
