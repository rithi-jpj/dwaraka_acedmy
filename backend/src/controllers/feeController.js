const { z } = require('zod');
const { Op, fn, col, literal } = require('sequelize');
const { Fee, User, Batch, Subject, Enrollment } = require('../models');
const { logAction } = require('./auditController');

// ── Helpers ──────────────────────────────────────────────────────────────

function generateInvoiceNo() {
  const prefix = 'DAF';
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${ts}${rand}`;
}

// ── Fee Structure CRUD ───────────────────────────────────────────────────

exports.create = async (req, res) => {
  const data = z.object({
    student_id: z.string().uuid(),
    batch_id: z.string().uuid().optional().nullable(),
    fee_head: z.string().min(1),
    amount: z.number().min(1),
    due_date: z.string(),
    term: z.string().optional(),
    academic_year: z.string().optional(),
    remarks: z.string().optional(),
  }).parse(req.body);

  const student = await User.findByPk(data.student_id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const fee = await Fee.create({
    ...data,
    invoice_no: generateInvoiceNo(),
    created_by: req.user.id,
  });

  const full = await Fee.findByPk(fee.id, {
    include: [
      { model: User, as: 'student', attributes: ['id', 'name', 'admission_no', 'current_class'] },
      { model: Batch, attributes: ['id', 'name'] },
    ],
  });

  logAction({
    userId: req.user.id, userName: req.user.name, userRole: req.user.role,
    action: 'create', resource: 'fee', resourceId: fee.id,
    description: `Created fee ${fee.invoice_no} for ${student.name}: ₹${data.amount}`,
    metadata: { invoice_no: fee.invoice_no, student_id: data.student_id, amount: data.amount, fee_head: data.fee_head },
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });

  res.status(201).json(full);
};

exports.list = async (req, res) => {
  const {
    page = '1', limit = '20', search = '',
    status, student_id, batch_id, academic_year,
    from_date, to_date,
    sort_by = 'due_date', sort_order = 'DESC',
  } = req.query;

  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;

  const where = {};
  if (status) where.status = status;
  if (student_id) where.student_id = student_id;
  if (batch_id) where.batch_id = batch_id;
  if (academic_year) where.academic_year = academic_year;
  if (from_date) where.due_date = { ...where.due_date, [Op.gte]: from_date };
  if (to_date) where.due_date = { ...where.due_date, [Op.lte]: to_date };

  if (search) {
    where[Op.or] = [
      { '$student.name$': { [Op.iLike]: `%${search}%` } },
      { invoice_no: { [Op.iLike]: `%${search}%` } },
      { fee_head: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const allowedSort = ['due_date', 'amount', 'paid_amount', 'status', 'created_at', 'fee_head'];
  const sortField = allowedSort.includes(sort_by) ? sort_by : 'due_date';
  const sortDir = sort_order === 'ASC' ? 'ASC' : 'DESC';

  const { rows, count } = await Fee.findAndCountAll({
    where,
    include: [
      { model: User, as: 'student', attributes: ['id', 'name', 'email', 'admission_no', 'current_class'] },
      { model: Batch, attributes: ['id', 'name'] },
    ],
    order: [[sortField, sortDir], ['created_at', 'DESC']],
    limit: l,
    offset,
  });

  // Calculate balance for each fee
  const fees = rows.map(f => {
    const json = f.toJSON();
    return {
      ...json,
      balance: json.amount - json.paid_amount,
      payment_status: json.paid_amount >= json.amount ? 'paid' : json.paid_amount > 0 ? 'partial' : 'pending',
    };
  });

  res.json({
    fees,
    pagination: { page: p, limit: l, total: count, pages: Math.ceil(count / l) },
  });
};

exports.getById = async (req, res) => {
  const fee = await Fee.findByPk(req.params.id, {
    include: [
      { model: User, as: 'student', attributes: ['id', 'name', 'admission_no', 'current_class', 'section'] },
      { model: Batch, attributes: ['id', 'name'] },
    ],
  });
  if (!fee) return res.status(404).json({ error: 'Fee record not found' });
  res.json(fee);
};

exports.update = async (req, res) => {
  const fee = await Fee.findByPk(req.params.id);
  if (!fee) return res.status(404).json({ error: 'Fee record not found' });

  const data = z.object({
    amount: z.number().min(1).optional(),
    due_date: z.string().optional(),
    fee_head: z.string().optional(),
    term: z.string().optional(),
    remarks: z.string().optional(),
  }).parse(req.body);

  Object.assign(fee, data, { updated_by: req.user.id });
  await fee.save();

  const full = await Fee.findByPk(fee.id, {
    include: [
      { model: User, as: 'student', attributes: ['id', 'name', 'admission_no'] },
      { model: Batch, attributes: ['id', 'name'] },
    ],
  });
  logAction({
    userId: req.user.id, userName: req.user.name, userRole: req.user.role,
    action: 'update', resource: 'fee', resourceId: fee.id,
    description: `Updated fee ${fee.invoice_no}`,
    metadata: { changes: data },
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });

  res.json(full);
};

exports.remove = async (req, res) => {
  const fee = await Fee.findByPk(req.params.id);
  if (!fee) return res.status(404).json({ error: 'Fee record not found' });
  await fee.destroy();
  logAction({
    userId: req.user.id, userName: req.user.name, userRole: req.user.role,
    action: 'delete', resource: 'fee', resourceId: req.params.id,
    description: `Deleted fee ${fee.invoice_no}`,
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });
  res.json({ ok: true });
};

// ── Payment Recording ────────────────────────────────────────────────────

exports.recordPayment = async (req, res) => {
  const fee = await Fee.findByPk(req.params.id);
  if (!fee) return res.status(404).json({ error: 'Fee record not found' });

  const data = z.object({
    amount: z.number().min(1),
    payment_mode: z.enum(['cash', 'card', 'online', 'bank_transfer', 'cheque']),
    transaction_id: z.string().optional(),
    remarks: z.string().optional(),
  }).parse(req.body);

  const newPaid = fee.paid_amount + data.amount;
  if (newPaid > fee.amount) {
    return res.status(400).json({ error: 'Payment amount exceeds the fee amount' });
  }

  fee.paid_amount = newPaid;
  fee.payment_date = new Date().toISOString().split('T')[0];
  fee.payment_mode = data.payment_mode;
  if (data.transaction_id) fee.transaction_id = data.transaction_id;
  if (data.remarks) fee.remarks = data.remarks;
  fee.status = newPaid >= fee.amount ? 'paid' : 'partial';
  fee.updated_by = req.user.id;
  await fee.save();

  const full = await Fee.findByPk(fee.id, {
    include: [
      { model: User, as: 'student', attributes: ['id', 'name', 'admission_no'] },
    ],
  });
  logAction({
    userId: req.user.id, userName: req.user.name, userRole: req.user.role,
    action: 'fee_payment', resource: 'fee', resourceId: fee.id,
    description: `Payment of ₹${data.amount} (${data.payment_mode}) for ${fee.invoice_no}`,
    metadata: { amount: data.amount, payment_mode: data.payment_mode, invoice_no: fee.invoice_no },
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });

  res.json(full);
};

// ── Bulk Create Fees ─────────────────────────────────────────────────────

exports.bulkCreate = async (req, res) => {
  const data = z.object({
    student_ids: z.array(z.string().uuid()).min(1),
    batch_id: z.string().uuid().optional().nullable(),
    fee_head: z.string().min(1),
    amount: z.number().min(1),
    due_date: z.string(),
    term: z.string().optional(),
    academic_year: z.string().optional(),
  }).parse(req.body);

  const created = [];
  for (const studentId of data.student_ids) {
    const fee = await Fee.create({
      student_id: studentId,
      batch_id: data.batch_id || null,
      fee_head: data.fee_head,
      amount: data.amount,
      due_date: data.due_date,
      term: data.term || null,
      academic_year: data.academic_year || undefined,
      invoice_no: generateInvoiceNo(),
      created_by: req.user.id,
    });
    created.push(fee.id);
  }

  logAction({
    userId: req.user.id, userName: req.user.name, userRole: req.user.role,
    action: 'create', resource: 'fee',
    description: `Bulk created ${created.length} fee records (${data.fee_head}, ₹${data.amount} each)`,
    metadata: { count: created.length, fee_head: data.fee_head, amount: data.amount, term: data.term },
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });

  res.status(201).json({ ok: true, count: created.length, ids: created });
};

// ── Student Self-Service ─────────────────────────────────────────────────

exports.myFees = async (req, res) => {
  const fees = await Fee.findAll({
    where: { student_id: req.user.id },
    include: [{ model: Batch, attributes: ['id', 'name'] }],
    order: [['due_date', 'DESC']],
  });

  const summary = {
    total_fees: fees.reduce((s, f) => s + f.amount, 0),
    total_paid: fees.reduce((s, f) => s + f.paid_amount, 0),
    total_pending: fees.reduce((s, f) => s + (f.amount - f.paid_amount), 0),
    pending_count: fees.filter(f => f.status === 'pending' || f.status === 'partial').length,
    paid_count: fees.filter(f => f.status === 'paid').length,
  };

  res.json({ fees, summary });
};

// ── Statistics & Dashboard ───────────────────────────────────────────────

exports.stats = async (req, res) => {
  const { academic_year, batch_id } = req.query;

  const where = {};
  if (academic_year) where.academic_year = academic_year;
  if (batch_id) where.batch_id = batch_id;

  const today = new Date().toISOString().split('T')[0];

  const totals = await Fee.findAll({
    where,
    attributes: [
      [fn('COUNT', col('id')), 'total_records'],
      [fn('SUM', col('amount')), 'total_amount'],
      [fn('SUM', col('paid_amount')), 'total_collected'],
      [fn('SUM', literal('amount - paid_amount')), 'total_pending'],
    ],
    raw: true,
  });

  const statusCounts = await Fee.findAll({
    where,
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  });

  const todayCollection = await Fee.findAll({
    where: { ...where, payment_date: today },
    attributes: [
      [fn('SUM', col('paid_amount')), 'total'],
      [fn('COUNT', col('id')), 'count'],
    ],
    raw: true,
  });

  // Monthly collection (current year)
  const year = new Date().getFullYear();
  const monthlyCollection = await Fee.findAll({
    where: {
      ...where,
      payment_date: {
        [Op.and]: [
          { [Op.gte]: `${year}-01-01` },
          { [Op.lte]: `${year}-12-31` },
        ],
      },
    },
    attributes: [
      [fn('to_char', col('payment_date'), 'YYYY-MM'), 'month'],
      [fn('SUM', col('paid_amount')), 'total'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: [fn('to_char', col('payment_date'), 'YYYY-MM')],
    order: [[fn('to_char', col('payment_date'), 'YYYY-MM'), 'ASC']],
    raw: true,
  });

  const t = totals[0] || {};
  const statusMap = {};
  statusCounts.forEach(s => { statusMap[s.status] = parseInt(s.count); });

  res.json({
    summary: {
      total_records: parseInt(t.total_records || 0),
      total_amount: parseFloat(t.total_amount || 0),
      total_collected: parseFloat(t.total_collected || 0),
      total_pending: parseFloat(t.total_pending || 0),
      collection_rate: parseFloat(t.total_amount || 0) > 0
        ? parseFloat((((t.total_collected || 0) / (t.total_amount || 0)) * 100).toFixed(1))
        : 0,
    },
    status_breakdown: {
      paid: statusMap.paid || 0,
      partial: statusMap.partial || 0,
      pending: statusMap.pending || 0,
      waived: statusMap.waived || 0,
    },
    today_collection: {
      total: parseFloat(todayCollection[0]?.total || 0),
      count: parseInt(todayCollection[0]?.count || 0),
    },
    monthly_collection: monthlyCollection.map(m => ({
      month: m.month,
      total: parseFloat(m.total || 0),
      count: parseInt(m.count || 0),
    })),
  });
};

// ── Export CSV ───────────────────────────────────────────────────────────

exports.exportCSV = async (req, res) => {
  const { status, batch_id, academic_year } = req.query;
  const where = {};
  if (status) where.status = status;
  if (batch_id) where.batch_id = batch_id;
  if (academic_year) where.academic_year = academic_year;

  const fees = await Fee.findAll({
    where,
    include: [
      { model: User, as: 'student', attributes: ['name', 'admission_no', 'current_class'] },
      { model: Batch, attributes: ['name'] },
    ],
    order: [['due_date', 'DESC']],
  });

  const header = 'Invoice No,Student Name,Admission No,Class,Batch,Fee Head,Amount,Paid,Balance,Due Date,Status,Payment Date,Payment Mode,Term\n';
  const csv = fees.map(f => [
    f.invoice_no || '',
    `"${f.student?.name || ''}"`,
    f.student?.admission_no || '',
    f.student?.current_class || '',
    `"${f.Batch?.name || ''}"`,
    `"${f.fee_head}"`,
    f.amount,
    f.paid_amount,
    f.amount - f.paid_amount,
    f.due_date || '',
    f.status,
    f.payment_date || '',
    f.payment_mode || '',
    f.term || '',
  ].join(',')).join('\n');

  logAction({
    userId: req.user.id, userName: req.user.name, userRole: req.user.role,
    action: 'export', resource: 'fee',
    description: `Exported ${fees.length} fee records to CSV`,
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=fees_export.csv`);
  res.send(header + csv);
};
