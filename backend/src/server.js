require('express-async-errors');
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');

const env = require('./config/env');
const { sequelize } = require('./models');
const routes = require('./routes');
const errorHandler = require('./middleware/error');
const initSockets = require('./sockets');

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', routes);
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: env.CORS_ORIGIN, credentials: true } });
initSockets(io);
app.set('io', io);

(async () => {
  await sequelize.authenticate();
  server.listen(env.PORT, () => {
    console.log(`Dwaraka Academy API listening on http://localhost:${env.PORT}`);
  });
})().catch((e) => { console.error(e); process.exit(1); });
