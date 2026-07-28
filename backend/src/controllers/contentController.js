const { z } = require('zod');
const { Op } = require('sequelize');
const { SiteContent } = require('../models');

// ── Schemas ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  section: z.enum([
    'hero', 'about', 'course', 'faculty', 'result', 'testimonial',
    'gallery', 'download', 'contact', 'setting',
  ]),
  key: z.string().max(100).optional().default(''),
  data: z.record(z.any()).optional().default({}),
  sort_order: z.number().int().optional().default(0),
  is_active: z.boolean().optional().default(true),
});

const updateSchema = z.object({
  key: z.string().max(100).optional(),
  data: z.record(z.any()).optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

// ── Controller ───────────────────────────────────────────────────────────

/** List content items with optional section filter, search, and pagination */
exports.list = async (req, res) => {
  const { page = 1, limit = 50, section, search, is_active } = req.query;
  const where = {};

  if (section) where.section = section;
  if (is_active !== undefined) where.is_active = is_active === 'true';
  if (search) {
    where[Op.or] = [
      { key: { [Op.iLike]: `%${search}%` } },
      { '$data.title$': { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows, count } = await SiteContent.findAndCountAll({
    where,
    order: [['section', 'ASC'], ['sort_order', 'ASC'], ['createdAt', 'DESC']],
    offset: (parseInt(page) - 1) * parseInt(limit),
    limit: parseInt(limit),
  });

  res.json({
    items: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / parseInt(limit)),
    },
  });
};

/** Get a single content item by ID */
exports.getById = async (req, res) => {
  const item = await SiteContent.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  res.json(item);
};

/** Get content by section — returns all active items for a section */
exports.getBySection = async (req, res) => {
  const items = await SiteContent.findAll({
    where: { section: req.params.section, is_active: true },
    order: [['sort_order', 'ASC'], ['createdAt', 'DESC']],
  });
  res.json(items);
};

/** Create a new content item */
exports.create = async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid data', details: parsed.error.errors });
  }
  const item = await SiteContent.create(parsed.data);
  res.status(201).json(item);
};

/** Update an existing content item */
exports.update = async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid data', details: parsed.error.errors });
  }

  const item = await SiteContent.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });

  await item.update(parsed.data);
  res.json(item);
};

/** Delete a content item */
exports.remove = async (req, res) => {
  const item = await SiteContent.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  await item.destroy();
  res.json({ ok: true });
};

/** Toggle active status */
exports.toggleActive = async (req, res) => {
  const item = await SiteContent.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  item.is_active = !item.is_active;
  await item.save();
  res.json(item);
};

/** Bulk save — replaces all content for a section */
exports.bulkSave = async (req, res) => {
  const parsed = z.object({
    section: z.string().min(1).max(100),
    items: z.array(z.object({
      key: z.string().max(100).optional().default(''),
      data: z.record(z.any()).optional().default({}),
      sort_order: z.number().int().optional().default(0),
      is_active: z.boolean().optional().default(true),
    })),
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid data', details: parsed.error.errors });
  }

  const { section, items } = parsed.data;

  // Remove existing items for this section
  await SiteContent.destroy({ where: { section } });

  // Create new items
  const created = await SiteContent.bulkCreate(
    items.map(item => ({ ...item, section })),
  );

  res.status(201).json({ items: created, count: created.length });
};
