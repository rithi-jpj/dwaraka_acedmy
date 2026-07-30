const { Op } = require('sequelize');
const { AuditLog } = require('../models');

// Helper to create audit entries (used by other controllers)
async function logAction({
  userId, userName, userRole, action, resource, resourceId,
  description, metadata, ipAddress, userAgent,
}) {
  try {
    await AuditLog.create({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action,
      resource: resource || null,
      resource_id: resourceId ? String(resourceId) : null,
      description: description || null,
      metadata: metadata || {},
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    });
  } catch (err) {
    console.error('[audit] Failed to log action:', err.message);
  }
}

// List audit logs (admin only, with pagination + filters)
exports.list = async (req, res) => {
  const {
    page = '1', limit = '50',
    action, resource, user_id, user_role,
    from_date, to_date,
    sort_by = 'created_at', sort_order = 'DESC',
  } = req.query;

  const p = Math.max(1, parseInt(page));
  const l = Math.min(200, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;

  const where = {};
  if (action) where.action = action;
  if (resource) where.resource = { [Op.iLike]: `%${resource}%` };
  if (user_id) where.user_id = user_id;
  if (user_role) where.user_role = user_role;
  if (from_date) where.created_at = { ...where.created_at, [Op.gte]: from_date };
  if (to_date) where.created_at = { ...where.created_at, [Op.lte]: to_date };

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    order: [[sort_by, sort_order === 'ASC' ? 'ASC' : 'DESC']],
    limit: l,
    offset,
  });

  res.json({
    logs: rows,
    pagination: { page: p, limit: l, total: count, pages: Math.ceil(count / l) },
  });
};

// Get stats (action counts, daily activity)
exports.stats = async (req, res) => {
  const { days = '7' } = req.query;
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));

  const total = await AuditLog.count({
    where: { created_at: { [Op.gte]: since } },
  });

  const actionCounts = await AuditLog.findAll({
    where: { created_at: { [Op.gte]: since } },
    attributes: ['action', [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('id')), 'count']],
    group: ['action'],
    raw: true,
  });

  const dailyCounts = await AuditLog.findAll({
    where: { created_at: { [Op.gte]: since } },
    attributes: [
      [AuditLog.sequelize.fn('DATE', AuditLog.sequelize.col('created_at')), 'date'],
      [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('id')), 'count'],
    ],
    group: [AuditLog.sequelize.fn('DATE', AuditLog.sequelize.col('created_at'))],
    order: [[AuditLog.sequelize.fn('DATE', AuditLog.sequelize.col('created_at')), 'ASC']],
    raw: true,
  });

  res.json({
    total,
    action_counts: actionCounts.reduce((acc, a) => ({ ...acc, [a.action]: parseInt(a.count) }), {}),
    daily_counts: dailyCounts.map(d => ({ date: d.date, count: parseInt(d.count) })),
  });
};

// Export { logAction } for use in other controllers
exports.logAction = logAction;
