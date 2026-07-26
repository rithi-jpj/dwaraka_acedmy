const env = require('../config/env');

module.exports = (err, req, res, next) => {
  // Log full error details server-side only (never to client)
  const reqInfo = {
    method: req.method,
    url: req.originalUrl || req.url,
    userId: req.user?.id || 'anonymous',
    userRole: req.user?.role || 'none',
  };
  console.error(`[error] ${new Date().toISOString()}`, JSON.stringify(reqInfo), err.stack || err.message || err);

  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'A record with that value already exists',
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      error: 'Operation failed due to existing linked records',
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors?.map((e) => e.message),
    });
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 5 MB.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field' });
  }
  if (err.message && err.message.startsWith('File type') || err.message && err.message.startsWith('MIME type')) {
    return res.status(400).json({ error: err.message });
  }

  // Generic error — never expose stack traces in production
  const status = err.status || 500;
  const message = env.NODE_ENV === 'production'
    ? 'An unexpected error occurred. Please try again later.'
    : (err.message || 'Server error');

  res.status(status).json({ error: message });
};
