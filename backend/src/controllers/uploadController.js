const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { FileUpload } = require('../models');
const env = require('../config/env');
const { logAction } = require('./auditController');

const UPLOAD_DIR = path.resolve(process.cwd(), env.UPLOAD_DIR);

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];

function isImage(mime) {
  return ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'].includes(mime);
}

function guessMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimes = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
  };
  return mimes[ext] || 'application/octet-stream';
}

// Upload file (multipart via multer)
exports.upload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const { originalname, filename, size, mimetype } = req.file;
  const ext = path.extname(originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    // Remove disallowed file
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: `File type ${ext} is not allowed` });
  }

  const record = await FileUpload.create({
    filename,
    original_name: originalname,
    mime_type: mimetype || guessMimeType(filename),
    size,
    extension: ext,
    is_image: isImage(mimetype || guessMimeType(filename)),
    path: `/uploads/${filename}`,
    uploaded_by: req.user.id,
    category: req.body.category || 'general',
  });

  logAction({
    userId: req.user.id, userName: req.user.name, userRole: req.user.role,
    action: 'upload', resource: 'file',
    resourceId: record.id, description: `Uploaded ${originalname}`,
    metadata: { filename, size, mime: mimetype },
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });

  res.status(201).json(record);
};

// List files from database
exports.list = async (req, res) => {
  const { page = '1', limit = '50', type, search, category } = req.query;
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;

  const { Op } = require('sequelize');
  const where = {};
  if (category) where.category = category;
  if (type === 'image') where.is_image = true;
  else if (type === 'document') where.is_image = false;
  if (search) {
    where[Op.or] = [
      { original_name: { [Op.iLike]: `%${search}%` } },
      { filename: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows, count } = await FileUpload.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: l,
    offset,
  });

  const totalSize = await FileUpload.sum('size', { where });

  res.json({
    files: rows.map(r => ({
      ...r.toJSON(),
      url: r.path,
      size: parseInt(r.size),
      formatted_size: formatSize(parseInt(r.size)),
    })),
    storage_usage: formatSize(totalSize || 0),
    pagination: { page: p, limit: l, total: count, pages: Math.ceil(count / l) },
  });
};

// Get file info
exports.getInfo = async (req, res) => {
  const record = await FileUpload.findOne({ where: { filename: req.params.filename } });
  if (!record) return res.status(404).json({ error: 'File not found' });
  res.json({ ...record.toJSON(), url: record.path, size: parseInt(record.size) });
};

// Delete file
exports.remove = async (req, res) => {
  const { filename } = req.params;
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const record = await FileUpload.findOne({ where: { filename } });
  if (!record) return res.status(404).json({ error: 'File not found' });

  const filePath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await record.destroy();

  logAction({
    userId: req.user.id, userName: req.user.name, userRole: req.user.role,
    action: 'delete', resource: 'file',
    resourceId: record.id, description: `Deleted ${record.original_name}`,
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });

  res.json({ ok: true, filename });
};

// Get storage stats
exports.storageStats = async (req, res) => {
  const totalSize = await FileUpload.sum('size') || 0;
  const totalFiles = await FileUpload.count();
  const byType = await FileUpload.findAll({
    attributes: ['mime_type', [FileUpload.sequelize.fn('COUNT', FileUpload.sequelize.col('id')), 'count']],
    group: ['mime_type'],
    raw: true,
  });
  res.json({
    total_files: totalFiles,
    total_size: totalSize,
    formatted_size: formatSize(totalSize),
    by_type: byType.map(t => ({ mime: t.mime_type, count: parseInt(t.count) })),
  });
};

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
