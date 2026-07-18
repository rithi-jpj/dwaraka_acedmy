const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const hash = (pw) => bcrypt.hash(pw, 10);
const compare = (pw, h) => bcrypt.compare(pw, h);
const randomPassword = (len = 12) =>
  crypto.randomBytes(len).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, len);

module.exports = { hash, compare, randomPassword };
