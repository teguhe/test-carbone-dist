require('dotenv').config();

const express = require('express');
const morgan  = require('morgan');
const path    = require('path');
const fs      = require('fs');

const reportRoutes   = require('./routes/report');
const templateRoutes = require('./routes/template');
const apikeyRoutes   = require('./routes/apikeys');
const { requireAuth } = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

// Pastikan folder output & templates ada
for (const dir of ['output', 'templates']) {
  const p = path.join(__dirname, '..', dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// ── Middleware global ──────────────────────────────────────────────────────────
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Endpoint publik (tanpa auth) ───────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Carbone Report API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Carbone Report API',
    auth: 'Semua endpoint /api/* memerlukan header: x-api-key: <key>',
    endpoints: {
      health:          'GET  /health             (publik)',
      listKeys:        'GET  /api/keys           (admin)',
      createKey:       'POST /api/keys           (admin)',
      revokeKey:       'DELETE /api/keys/:key    (admin)',
      listTemplates:   'GET  /api/templates      (user/admin)',
      uploadTemplate:  'POST /api/templates/upload (user/admin)',
      deleteTemplate:  'DELETE /api/templates/:nama (user/admin)',
      generateReport:  'POST /api/reports/generate (user/admin)',
      downloadReport:  'GET  /api/reports/download/:filename (user/admin)',
    },
  });
});

// ── Endpoint terproteksi — semua wajib auth ────────────────────────────────────
app.use('/api/reports',   requireAuth, reportRoutes);
app.use('/api/templates', requireAuth, templateRoutes);
app.use('/api/keys',      apikeyRoutes);   // auth sudah di dalam route (requireAdmin)

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Carbone API berjalan di http://localhost:${PORT}`);
  console.log(`🔑 Belum punya API key? Jalankan: node scripts/setup.js\n`);
});

module.exports = app;
