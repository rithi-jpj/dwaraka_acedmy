module.exports = (err, req, res, next) => {
  console.error(err);
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Duplicate value', details: err.errors?.map(e => e.message) });
  }
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
};
