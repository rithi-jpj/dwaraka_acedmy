const { z } = require('zod');
const { Announcement, User } = require('../models');

exports.list = async (req, res) => {
  const rows = await Announcement.findAll({
    include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role'] }],
    order: [['created_at', 'DESC']],
    limit: 100,
  });
  res.json(rows);
};

exports.create = async (req, res) => {
  const d = z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    audience: z.enum(['all', 'teachers', 'students']).default('all'),
  }).parse(req.body);
  const row = await Announcement.create({ ...d, author_id: req.user.id });
  const io = req.app.get('io');
  io.emit('announcement:new', { id: row.id, title: row.title, audience: row.audience });
  res.status(201).json(row);
};
