/**
 * src/middleware/auth.js
 *
 * Middleware autentikasi API key.
 *
 * Cara kirim key (pilih salah satu):
 *   Header:       x-api-key: cr_xxxx
 *   Bearer token: Authorization: Bearer cr_xxxx
 *   Query string: ?api_key=cr_xxxx  (tidak direkomendasikan di production)
 */

const { validateKey } = require('../lib/keyStore');

/**
 * Middleware umum — wajib login (user atau admin).
 */
function requireAuth(req, res, next) {
  const raw = extractKey(req);

  if (!raw) {
    return res.status(401).json({
      success: false,
      error: 'API key tidak ditemukan. Kirim via header x-api-key atau Authorization: Bearer <key>.',
    });
  }

  const record = validateKey(raw);

  if (!record) {
    return res.status(403).json({
      success: false,
      error: 'API key tidak valid atau sudah dinonaktifkan.',
    });
  }

  // Tempel info key ke request supaya bisa dipakai di route
  req.apiKey = record;
  next();
}

/**
 * Middleware khusus admin — hanya role "admin" yang boleh lewat.
 */
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.apiKey.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Akses ditolak. Endpoint ini hanya untuk admin.',
      });
    }
    next();
  });
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function extractKey(req) {
  // 1. Header x-api-key
  if (req.headers['x-api-key']) return req.headers['x-api-key'].trim();

  // 2. Authorization: Bearer <key>
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();

  // 3. Query string (fallback, hindari di production)
  if (req.query.api_key) return req.query.api_key.trim();

  return null;
}

module.exports = { requireAuth, requireAdmin };
