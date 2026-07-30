const { z } = require('zod');
const { Op } = require('sequelize');
const { Notification, NotificationReceipt, User } = require('../models');
const { logAction } = require('./auditController');

// ── Schemas ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  audience: z.enum(['all', 'students', 'teachers', 'parents', 'specific']).default('all'),
  type: z.enum(['information', 'warning', 'success', 'exam', 'fee_reminder', 'holiday', 'assignment', 'event']).default('information'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  target_user_ids: z.array(z.string().uuid()).optional().default([]),
  link_url: z.string().optional(),
  scheduled_at: z.string().datetime().optional(),
});

const receiptSchema = z.object({
  notification_id: z.string().uuid(),
});

// ── Helpers ──────────────────────────────────────────────────────────────

async function getTargetUserIds(audience, targetIds) {
  if (audience === 'specific') return targetIds;
  if (audience === 'all') {
    const users = await User.findAll({ attributes: ['id'], where: { is_active: true } });
    return users.map(u => u.id);
  }
  const users = await User.findAll({
    attributes: ['id'],
    where: { role: audience.slice(0, -1), is_active: true }, // 'students' -> 'student'
  });
  return users.map(u => u.id);
}

// ── Send Notification ────────────────────────────────────────────────────

exports.send = async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid data', details: parsed.error.errors });
  }

  const data = parsed.data;

  // Create the notification
  const notification = await Notification.create({
    sender_id: req.user.id,
    audience: data.audience,
    type: data.type,
    title: data.title,
    body: data.body,
    priority: data.priority,
    target_user_ids: data.audience === 'specific' ? data.target_user_ids : [],
    link_url: data.link_url || null,
    scheduled_at: data.scheduled_at || null,
    sent_at: data.scheduled_at ? null : new Date(),
  });

  // Distribute receipts to target users (fire and forget — don't block response)
  if (!data.scheduled_at) {
    const targetIds = await getTargetUserIds(data.audience, data.target_user_ids);
    const receipts = targetIds.map(userId => ({
      notification_id: notification.id,
      user_id: userId,
    }));

    // Batch insert receipts
    if (receipts.length > 0) {
      await NotificationReceipt.bulkCreate(receipts, { ignoreDuplicates: true });
    }
  }

  // Emit socket event for real-time delivery
  const io = req.app.get('io');
  if (io) {
    // Emit to audience-specific Socket.IO rooms (clients join these rooms on connect)
    if (data.audience === 'all') {
      io.to('notifications:all').emit('notification', {
        id: notification.id, title: notification.title,
        body: notification.body, type: notification.type,
        priority: notification.priority, created_at: notification.created_at,
      });
    } else if (data.audience !== 'specific') {
      io.to(`notifications:${data.audience}`).emit('notification', {
        id: notification.id, title: notification.title,
        body: notification.body, type: notification.type,
        priority: notification.priority, created_at: notification.created_at,
      });
    }
    // Always emit global event for unread badge updates
    io.emit('notifications:new', { id: notification.id, title: notification.title, type: notification.type, audience: notification.audience });
  }

  logAction({
    userId: req.user.id, userName: req.user.name, userRole: req.user.role,
    action: 'notification_sent', resource: 'notification', resourceId: notification.id,
    description: `Sent notification "${data.title}" to ${data.audience}`,
    metadata: { title: data.title, audience: data.audience, type: data.type, priority: data.priority },
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });

  res.status(201).json(notification);
};

// ── List Notifications (Admin) ────────────────────────────────────────────

exports.list = async (req, res) => {
  const { page = '1', limit = '20', type, audience, sort_by = 'created_at', sort_order = 'DESC' } = req.query;

  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;

  const where = {};
  if (type) where.type = type;
  if (audience) where.audience = audience;

  const allowedSort = ['created_at', 'title', 'type', 'priority', 'audience'];
  const sortField = allowedSort.includes(sort_by) ? sort_by : 'created_at';
  const sortDir = sort_order === 'ASC' ? 'ASC' : 'DESC';

  const { rows, count } = await Notification.findAndCountAll({
    where,
    include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }],
    order: [[sortField, sortDir]],
    limit: l,
    offset,
  });

  // Attach read counts
  const notifications = await Promise.all(rows.map(async (n) => {
    const totalReceipts = await NotificationReceipt.count({ where: { notification_id: n.id } });
    const readReceipts = await NotificationReceipt.count({ where: { notification_id: n.id, is_read: true } });
    return {
      ...n.toJSON(),
      total_receipts: totalReceipts,
      read_receipts: readReceipts,
      read_percentage: totalReceipts > 0 ? Math.round((readReceipts / totalReceipts) * 100) : 0,
    };
  }));

  res.json({
    notifications,
    pagination: { page: p, limit: l, total: count, pages: Math.ceil(count / l) },
  });
};

// ── User's Inbox ─────────────────────────────────────────────────────────

exports.myInbox = async (req, res) => {
  const { page = '1', limit = '20', unread_only = 'false' } = req.query;
  const p = Math.max(1, parseInt(page));
  const l = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;

  const where = { user_id: req.user.id };
  if (unread_only === 'true') where.is_read = false;

  const { rows, count } = await NotificationReceipt.findAndCountAll({
    where,
    include: [{
      model: Notification,
      as: 'notification',
      where: { is_active: true },
      include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }],
    }],
    order: [['created_at', 'DESC']],
    limit: l,
    offset,
  });

  const unreadCount = await NotificationReceipt.count({
    where: { user_id: req.user.id, is_read: false },
  });

  res.json({
    receipts: rows.map(r => r.toJSON()),
    pagination: { page: p, limit: l, total: count, pages: Math.ceil(count / l) },
    unread_count: unreadCount,
  });
};

// ── Mark as Read ─────────────────────────────────────────────────────────

exports.markRead = async (req, res) => {
  const parsed = receiptSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid notification ID' });
  }

  const receipt = await NotificationReceipt.findOne({
    where: {
      notification_id: parsed.data.notification_id,
      user_id: req.user.id,
    },
  });

  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

  receipt.is_read = true;
  receipt.read_at = new Date();
  await receipt.save();

  res.json({ ok: true });
};

// ── Mark All as Read ─────────────────────────────────────────────────────

exports.markAllRead = async (req, res) => {
  await NotificationReceipt.update(
    { is_read: true, read_at: new Date() },
    { where: { user_id: req.user.id, is_read: false } },
  );
  res.json({ ok: true });
};

// ── Unread Count ─────────────────────────────────────────────────────────

exports.unreadCount = async (req, res) => {
  const count = await NotificationReceipt.count({
    where: { user_id: req.user.id, is_read: false },
  });
  res.json({ count });
};

// ── Delete Notification (Admin) ──────────────────────────────────────────

exports.remove = async (req, res) => {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification) return res.status(404).json({ error: 'Notification not found' });

  // Soft delete — mark as inactive
  notification.is_active = false;
  await notification.save();

  logAction({
    userId: req.user.id, userName: req.user.name, userRole: req.user.role,
    action: 'delete', resource: 'notification', resourceId: req.params.id,
    description: `Deleted notification "${notification.title}"`,
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });

  res.json({ ok: true });
};
