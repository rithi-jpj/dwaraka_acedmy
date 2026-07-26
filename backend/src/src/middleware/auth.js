const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');

async function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    // Verify token has required claims
    if (!payload.sub || !payload.role) {
      return res.status(401).json({ error: 'Invalid token claims' });
    }

    const user = await User.findByPk(payload.sub);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    // Verify role hasn't been tampered with
    if (user.role !== payload.role) {
      return res.status(401).json({ error: 'Token role mismatch' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const ts = new Date().toISOString();
      console.log(`[security] ${ts} event=permission_denied`, JSON.stringify({
        userId: req.user?.id || 'anonymous',
        userRole: req.user?.role || 'none',
        requiredRoles: roles,
        method: req.method,
        path: req.originalUrl || req.url,
      }));
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

/**
 * Middleware factory: verify that the requesting user owns the resource.
 * For students: req.params[studentIdField] must match req.user.id.
 * For parents: req.params[studentIdField] is a child linked to this parent.
 */
function requireOwnership(studentIdField = 'studentId') {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const targetId = req.params[studentIdField];

    if (req.user.role === 'admin') {
      // Admin can access any resource
      return next();
    }

    if (req.user.role === 'student') {
      // Students can only access their own data
      if (targetId && targetId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: you can only access your own data' });
      }
      return next();
    }

    if (req.user.role === 'teacher') {
      // Teachers can access students in their batches — skip ownership check here
      // Batch-scoped access is enforced at the controller level
      return next();
    }

    if (req.user.role === 'parent') {
      // Parents can only access linked students' data
      if (!targetId) return next();
      const { ParentLink } = require('../models');
      const link = await ParentLink.findOne({
        where: { parent_id: req.user.id, student_id: targetId },
      });
      if (!link) {
        return res.status(403).json({ error: 'Forbidden: you can only view your linked students' });
      }
      return next();
    }

    next();
  };
}

module.exports = { authRequired, requireRole, requireOwnership };
