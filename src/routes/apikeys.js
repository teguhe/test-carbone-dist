/**
 * src/routes/apikeys.js
 *
 * Endpoint manajemen API key — hanya bisa diakses oleh admin.
 *
 * POST   /api/keys          → Buat key baru
 * GET    /api/keys          → List semua key
 * DELETE /api/keys/:key     → Hapus / revoke key
 */

const express = require('express');
const router  = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { createKey, listKeys, revokeKey, deleteKey } = require('../lib/keyStore');

// Semua endpoint di sini wajib admin
router.use(requireAdmin);

/**
 * POST /api/keys
 * Body: { "label": "Nama App", "role": "user" | "admin" }
 */
router.post('/', (req, res) => {
  const { label = 'Unnamed', role = 'user' } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Role harus "user" atau "admin".' });
  }

  const record = createKey(label, role);

  res.status(201).json({
    success: true,
    message: '✅ API key berhasil dibuat. Simpan key ini — tidak akan ditampilkan lagi.',
    data: record,   // satu-satunya saat key mentah ditampilkan penuh
  });
});

/**
 * GET /api/keys
 * List semua key (key value di-mask)
 */
router.get('/', (req, res) => {
  const keys = listKeys();
  res.json({ success: true, total: keys.length, data: keys });
});

/**
 * DELETE /api/keys/:key?action=revoke|delete
 * action=revoke  → nonaktifkan (default)
 * action=delete  → hapus permanen
 */
router.delete('/:key', (req, res) => {
  const raw    = req.params.key;
  const action = req.query.action || 'revoke';

  let ok = false;
  let message = '';

  if (action === 'delete') {
    ok = deleteKey(raw);
    message = ok ? 'Key berhasil dihapus permanen.' : 'Key tidak ditemukan.';
  } else {
    ok = revokeKey(raw);
    message = ok ? 'Key berhasil dinonaktifkan (revoked).' : 'Key tidak ditemukan.';
  }

  if (!ok) return res.status(404).json({ success: false, error: message });
  res.json({ success: true, message });
});

module.exports = router;
