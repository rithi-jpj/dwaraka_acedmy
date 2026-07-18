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

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.sub}`);
    socket.join(`role:${socket.user.role}`);
    socket.on('disconnect', () => {});
  });
};
