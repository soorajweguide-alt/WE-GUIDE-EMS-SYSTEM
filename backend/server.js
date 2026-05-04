require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const { initDB } = require('./database/db');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ 
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"]
    }
  }
}));
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static ────────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── Public profile HTML page (phone camera scan) ─────────────────────────────
app.get('/profile/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// ─── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
});

// ─── API Routes (registered after DB init) ────────────────────────────────────
function start() {
  initDB();
  console.log('✅ SQLite database initialised');

  app.use('/api/employees',  require('./routes/employees'));
  app.use('/api/attendance', require('./routes/attendance'));
  app.use('/api/public',     require('./routes/public'));

  // 404
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `${req.path} not found` });
  });

  // Error handler
  app.use((err, req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  app.listen(PORT, () => {
    console.log(`\n🚀 WE GUIDE API  →  http://localhost:${PORT}`);
    console.log(`📋 Health check  →  http://localhost:${PORT}/api/health\n`);
  });
}

try { start(); } catch (err) { console.error(err); process.exit(1); }
