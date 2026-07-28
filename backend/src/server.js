require('express-async-errors');
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const xss = require('xss');
const morgan = require('morgan');
const { Server } = require('socket.io');

const env = require('./config/env');
const { sequelize, User } = require('./models');
const { hash } = require('./utils/password');
const routes = require('./routes');
const errorHandler = require('./middleware/error');
const initSockets = require('./sockets');

const app = express();

// Disable X-Powered-By header
app.disable('x-powered-by');

// --- Compression middleware (responses compressed with gzip/brotli) ---
app.use(compression());

// --- XSS Sanitization middleware (strips HTML/script from all incoming string values) ---
function sanitizeValue(val) {
  if (typeof val === 'string') return xss(val, { whiteList: {}, stripIgnoreTag: true });
  if (Array.isArray(val)) return val.map(sanitizeValue);
  if (val && typeof val === 'object' && val.constructor === Object) {
    const sanitized = {};
    for (const [k, v] of Object.entries(val)) {
      sanitized[k] = sanitizeValue(v);
    }
    return sanitized;
  }
  return val;
}
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
});

// --- Security headers via Helmet ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "ws://localhost:*", "http://localhost:*", "ws://127.0.0.1:*", "http://127.0.0.1:*"],
      frameAncestors: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}))

// --- Accept multiple CORS origins (comma-separated) or any localhost origin in dev ---
const corsOrigins = (env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(s => s.trim());
const corsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return cb(null, true);
    // Allow any localhost origin in development
    if (env.NODE_ENV === 'development' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    // Check against the explicit allowlist
    if (corsOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// --- Rate limiters ---

// Strict limiter for login endpoint (prevent brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate limiter for forgot-password
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour per IP
  message: { error: 'Too many password reset requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate limiter for upload endpoints
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 uploads per hour per IP
  message: { error: 'Too many uploads. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate limiter for user creation (prevent mass account creation)
const accountCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 account creations per hour per IP
  message: { error: 'Too many account creation requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter (all other routes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters — apply general limiter to all /api routes first
app.use('/api', apiLimiter);

// Then apply stricter limiters to specific routes AFTER the general limiter
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/forgot-password', forgotPasswordLimiter);

// Apply upload limiter to routes that accept file uploads (we'll wrap in route setup)

app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev', {
  skip: (_req, res) => res.statusCode < 400, // Only log errors in production
}));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', routes);
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });
initSockets(io);
app.set('io', io);  (async () => {
  try {
    console.log("Connecting to PostgreSQL...");
    await sequelize.authenticate();
    console.log("Database connected.");

    console.log("Creating/updating database tables...");
    await sequelize.sync({ alter: true });
    console.log("Database tables are ready.");

    // Seed site content (non-blocking — updates existing, creates missing)
    try {
      const { SiteContent } = require('./models');
      const seedData = [
        { section: 'hero', key: 'main', sort_order: 0, data: { title: 'Dwaraka Academy', subtitle: 'Excellence in Education Since 2020', headline: 'Admissions Open', description: 'Empowering students with quality education through expert faculty, personalized attention, and proven results.', tags: ['CBSE', 'JEE', 'NEET'], highlights: ['Quality Education', 'Experienced Faculty', 'Excellent Results', 'Individual Attention'] } },
        { section: 'contact', key: 'main', sort_order: 0, data: { address: '12-2-711/A/75, Site 2, LIC Colony, Mehdipatnam, Hyderabad - 500028', phone: '+91 9030698785', email: 'info@dwarakaacademy.com', workingHours: 'Mon–Sat: 6:00 AM – 8:00 PM', whatsapp: '+919030698785' } },
        { section: 'settings', key: 'general', sort_order: 0, data: { academyName: 'Dwaraka Academy', tagline: 'Excellence in Education', foundedYear: 2020 } },
      ];
      for (const item of seedData) {
        const existing = await SiteContent.findOne({ where: { section: item.section, key: item.key } });
        if (!existing) await SiteContent.create(item);
      }
      console.log('[seed] Site content seeded.');
    } catch (seedErr) {
      console.log('[seed] Site content seed skipped (table may not exist yet):', seedErr.message);
    }

    // Ensure admin account exists
    const adminEmail = 'rustlessirongolem@gmail.com';
    let admin = await User.findOne({ where: { email: adminEmail } });
    if (admin) {
      admin.password_hash = await hash('Rithish@9030');
      admin.role = 'admin';
      await admin.save();
      console.log(`Admin updated: ${adminEmail}`);
    } else {
      await User.create({
        name: 'Administrator',
        email: adminEmail,
        role: 'admin',
        password_hash: await hash('Rithish@9030'),
        must_change_password: true,
      });
      console.log(`Admin created: ${adminEmail}`);
    }

    server.listen(env.PORT, () => {
      console.log(`Dwaraka Academy API listening on port ${env.PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err);
    process.exit(1);
  }
})();
