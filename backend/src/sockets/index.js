const jwt = require('jsonwebtoken');
const env = require('../config/env');

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      socket.user = jwt.verify(token, env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    
    // Join user-specific room (always)
    socket.join(`user:${user.sub}`);
    // Join role-based room
    socket.join(`role:${user.role}`);
    // Join notification audience rooms
    if (user.role === 'admin') socket.join('notifications:admin');
    socket.join('notifications:all');
    socket.join(`notifications:${user.role}s`); // 'student' -> 'students', 'teacher' -> 'teachers', etc.
    
    // Analytics room for admin
    if (user.role === 'admin') {
      socket.join('analytics:admin');
    }

    // If user is a student or teacher, join batch rooms
    if (user.role === 'student' || user.role === 'teacher') {
      try {
        const { Enrollment, Batch } = require('../models');
        let enrollments;
        if (user.role === 'student') {
          enrollments = await Enrollment.findAll({
            where: { student_id: user.sub },
            include: [{ model: Batch, attributes: ['id'] }],
          });
        } else {
          enrollments = await Batch.findAll({
            where: { teacher_id: user.sub, is_active: true },
            attributes: ['id'],
          });
        }
        for (const e of enrollments) {
          const batchId = e.batch_id || e.id;
          socket.join(`batch:${batchId}`);
        }
      } catch (err) {
        console.error('[socket] Failed to join batch rooms:', err.message);
      }
    }

    // Handle notification acknowledgment
    socket.on('notification:ack', (data) => {
      if (data?.notification_id) {
        io.to(`user:${user.sub}`).emit('notification:acknowledged', {
          notification_id: data.notification_id,
          user_id: user.sub,
        });
      }
    });

    // Handle manual room join requests (for late-loaded data)
    socket.on('room:join', (room) => {
      if (typeof room === 'string') {
        socket.join(room);
      }
    });

    socket.on('room:leave', (room) => {
      if (typeof room === 'string') {
        socket.leave(room);
      }
    });

    socket.on('disconnect', () => {
      // Cleanup is automatic for socket rooms
    });
  });

  // Analytics refresh helper
  io.refreshAnalytics = () => {
    io.to('analytics:admin').emit('analytics:refresh');
  };

  // Send notification to audience
  io.sendNotification = (notification, audience) => {
    if (audience === 'all') {
      io.to('notifications:all').emit('notification', notification);
    } else if (audience === 'specific') {
      // For specific users, emit to each user's room
      if (notification.target_user_ids) {
        for (const userId of notification.target_user_ids) {
          io.to(`user:${userId}`).emit('notification', notification);
        }
      }
    } else {
      // audience is 'students', 'teachers', 'parents'
      io.to(`notifications:${audience}`).emit('notification', notification);
    }
    // Always emit for unread badge update
    io.emit('notifications:new', {
      id: notification.id,
      title: notification.title,
      type: notification.type,
      audience: notification.audience,
    });
  };
};
