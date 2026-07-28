const { z } = require('zod');
const { Enquiry } = require('../models');

exports.submit = async (req, res) => {
  const parsed = z.object({
    studentName: z.string().min(1).max(255),
    parentName: z.string().min(1).max(255),
    phone: z.string().min(10).max(20),
    email: z.string().email().max(255),
    studentClass: z.string().max(50).optional().default(''),
    course: z.string().max(255).optional().default(''),
    message: z.string().max(2000).optional().default(''),
  }).strip().safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid form data', details: parsed.error.errors });
  }

  const enquiry = await Enquiry.create(parsed.data);
  res.status(201).json({ ok: true, id: enquiry.id });
};

exports.list = async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const where = {};
  if (status) where.status = status;

  const { rows, count } = await Enquiry.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    offset: (parseInt(page) - 1) * parseInt(limit),
    limit: parseInt(limit),
  });

  res.json({
    enquiries: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / parseInt(limit)),
    },
  });
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const parsed = z.object({
    status: z.enum(['new', 'contacted', 'closed']),
  }).strip().safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const enquiry = await Enquiry.findByPk(id);
  if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });

  enquiry.status = parsed.data.status;
  await enquiry.save();
  res.json({ ok: true });
};
