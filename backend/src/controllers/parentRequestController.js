const { z } = require('zod');
const { Op, fn, col } = require('sequelize');
const { sequelize, ParentRequest, ParentLink, User } = require('../models');
const { hash, randomPassword } = require('../utils/password');
const { sendMail, parentApprovalEmail } = require('../utils/mailer');

// Student submits a parent account request
exports.submit = async (req, res) => {
  const data = z.object({
    parent_name: z.string().min(1, 'Parent name is required'),
    parent_email: z.string().email('Valid email is required'),
    parent_phone: z.string().optional(),
  }).strip().parse(req.body);

  // Only students can submit
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can request a parent account' });
  }

  // Check if student already has a pending request
  const existing = await ParentRequest.findOne({
    where: { student_id: req.user.id, status: 'pending' },
  });
  if (existing) {
    return res.status(409).json({ error: 'You already have a pending request' });
  }

  // Check if student already has a linked parent
  const existingLink = await ParentLink.findOne({
    where: { student_id: req.user.id },
  });
  if (existingLink) {
    return res.status(409).json({ error: 'A parent account is already linked to your profile' });
  }

  // Check if email already has a parent account
  const existingUser = await User.findOne({ where: { email: data.parent_email.toLowerCase() } });
  if (existingUser) {
    return res.status(409).json({ error: 'This email already belongs to an existing user' });
  }

  const request = await ParentRequest.create({
    student_id: req.user.id,
    parent_name: data.parent_name,
    parent_email: data.parent_email.toLowerCase(),
    parent_phone: data.parent_phone || null,
    status: 'pending',
  });

  res.status(201).json(request);
};

// Student checks their request status
exports.myRequest = async (req, res) => {
  const requests = await ParentRequest.findAll({
    where: { student_id: req.user.id },
    order: [['created_at', 'DESC']],
  });
  res.json(requests);
};

// Admin lists all requests with search, filter, pagination
exports.list = async (req, res) => {
  const {
    page = '1',
    limit = '20',
    search = '',
    status = '',
    sort_by = 'created_at',
    sort_order = 'DESC',
  } = req.query;

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const where = {};

  if (status) where.status = status;

  if (search) {
    where[Op.or] = [
      { parent_name: { [Op.iLike]: `%${search}%` } },
      { parent_email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const allowedSort = ['parent_name', 'parent_email', 'status', 'created_at'];
  const orderField = allowedSort.includes(sort_by) ? sort_by : 'created_at';
  const order = sort_order === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await ParentRequest.findAndCountAll({
    where,
    include: [
      { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'reviewer', attributes: ['id', 'name'] },
    ],
    order: [[orderField, order]],
    offset,
    limit: Math.min(parseInt(limit, 10), 100),
  });

  res.json({
    requests: rows,
    pagination: {
      page: Math.max(1, parseInt(page, 10)),
      limit: Math.min(parseInt(limit, 10), 100),
      total: count,
      total_pages: Math.ceil(count / Math.min(parseInt(limit, 10), 100)),
    },
  });
};

// Admin gets a single request by ID
exports.getById = async (req, res) => {
  const request = await ParentRequest.findByPk(req.params.id, {
    include: [
      { model: User, as: 'student', attributes: ['id', 'name', 'email', 'phone'] },
      { model: User, as: 'reviewer', attributes: ['id', 'name'] },
    ],
  });
  if (!request) return res.status(404).json({ error: 'Request not found' });
  res.json(request);
};

// Admin approves a request - creates parent account + link
exports.approve = async (req, res) => {
  const body = z.object({
    relationship: z.string().optional(),
  }).strip().parse(req.body);

  const request = await ParentRequest.findByPk(req.params.id, {
    include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }],
  });
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.status !== 'pending') return res.status(400).json({ error: `Request already ${request.status}` });

  const tempPassword = randomPassword(10);

  // Use transaction to prevent orphaned records
  const result = await sequelize.transaction(async (t) => {
    // Re-check status inside transaction with lock
    const freshRequest = await ParentRequest.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!freshRequest || freshRequest.status !== 'pending') {
      throw Object.assign(new Error('Request already processed'), { status: 400 });
    }

    // Create parent user account
    const parent = await User.create({
      name: freshRequest.parent_name,
      email: freshRequest.parent_email,
      phone: freshRequest.parent_phone || null,
      role: 'parent',
      password_hash: await hash(tempPassword),
      must_change_password: true,
      meta: { linked_student_id: freshRequest.student_id },
    }, { transaction: t });

    // Create parent-student link
    await ParentLink.create({
      parent_id: parent.id,
      student_id: freshRequest.student_id,
      relationship: body.relationship || 'guardian',
    }, { transaction: t });

    // Update request status
    freshRequest.status = 'approved';
    freshRequest.reviewed_by = req.user.id;
    freshRequest.reviewed_at = new Date();
    await freshRequest.save({ transaction: t });

    return { parent, student: request.student };
  });

  // Send email (outside transaction - non-critical)
  await sendMail({
    to: result.parent.email,
    ...parentApprovalEmail({ parentName: result.parent.name, studentName: result.student.name, email: result.parent.email, tempPassword }),
  }).catch(() => {});

  console.log(`[parent:created] ${result.parent.email} temp_password=${tempPassword} linked_to=${request.student_id}`);

  res.json({
    ok: true,
    message: 'Parent account created and approved',
    parent: { id: result.parent.id, name: result.parent.name, email: result.parent.email },
    tempPassword,
  });
};

// Admin rejects a request
exports.reject = async (req, res) => {
  const data = z.object({
    rejection_reason: z.string().optional(),
  }).strip().parse(req.body);

  const request = await ParentRequest.findByPk(req.params.id, {
    include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }],
  });
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.status !== 'pending') return res.status(400).json({ error: `Request already ${request.status}` });

  request.status = 'rejected';
  request.reviewed_by = req.user.id;
  request.reviewed_at = new Date();
  request.rejection_reason = data.rejection_reason || null;
  await request.save();

  res.json({ ok: true, message: 'Request rejected' });
};

// Admin deletes a request
exports.remove = async (req, res) => {
  const request = await ParentRequest.findByPk(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  await request.destroy();
  res.json({ ok: true, message: 'Request deleted' });
};
