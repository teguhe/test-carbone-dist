/**
 * src/lib/keyStore.js
 *
 * Penyimpanan API key sederhana berbasis file JSON.
 * Menyimpan di: /keys.json (root project)
 *
 * Struktur data di file:
 * {
 *   "cr_xxxx": {
 *     "key":       "cr_xxxx",
 *     "label":     "Aplikasi Frontend",
 *     "role":      "user",          // "user" | "admin"
 *     "active":    true,
 *     "createdAt": "2026-04-27T...",
 *     "lastUsed":  "2026-04-27T..." | null
 *   }
 * }
 */

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const KEY_FILE = path.join(__dirname, '..', '..', 'keys.json');

// ── Baca / tulis file ─────────────────────────────────────────────────────────

function readStore() {
  if (!fs.existsSync(KEY_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeStore(data) {
  fs.writeFileSync(KEY_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Generate API key baru.
 * @param {string} label  - Nama / keterangan key (misal "Aplikasi Mobile")
 * @param {string} role   - "user" | "admin"
 * @returns {object} record key yang baru dibuat (termasuk key mentah)
 */
function createKey(label = 'Unnamed', role = 'user') {
  const raw   = 'cr_' + crypto.randomBytes(24).toString('hex');
  const store = readStore();

  store[raw] = {
    key:       raw,
    label,
    role,
    active:    true,
    createdAt: new Date().toISOString(),
    lastUsed:  null,
  };

  writeStore(store);
  return store[raw];
}

/**
 * Validasi key — return record jika valid, null jika tidak.
 * Juga update lastUsed secara async (tidak blocking).
 */
function validateKey(raw) {
  const store = readStore();
  const record = store[raw];
  if (!record || !record.active) return null;

  // Update lastUsed (fire and forget)
  record.lastUsed = new Date().toISOString();
  store[raw] = record;
  try { writeStore(store); } catch { /* abaikan error tulis */ }

  return record;
}

/** List semua key (tanpa nilai raw — untuk keamanan) */
function listKeys() {
  const store = readStore();
  return Object.values(store).map(({ key, label, role, active, createdAt, lastUsed }) => ({
    key:       key.slice(0, 10) + '••••••••',  // masking sebagian
    label,
    role,
    active,
    createdAt,
    lastUsed,
  }));
}

/** Nonaktifkan key (soft delete) */
function revokeKey(raw) {
  const store = readStore();
  if (!store[raw]) return false;
  store[raw].active = false;
  writeStore(store);
  return true;
}

/** Hapus permanen */
function deleteKey(raw) {
  const store = readStore();
  if (!store[raw]) return false;
  delete store[raw];
  writeStore(store);
  return true;
}

module.exports = { createKey, validateKey, listKeys, revokeKey, deleteKey };
