/**
 * scripts/setup.js
 *
 * Jalankan SEKALI saat pertama kali setup untuk membuat
 * admin API key pertama dan file .env.
 *
 * Usage:
 *   node scripts/setup.js
 */

const fs   = require('fs');
const path = require('path');
const { createKey } = require('../src/lib/keyStore');

const ENV_FILE = path.join(__dirname, '..', '.env');

console.log('\n🔧 Setup Carbone API...\n');

// 1. Buat admin key pertama
const adminKey = createKey('Admin Key (setup)', 'admin');
console.log('✅ Admin API key dibuat:');
console.log('━'.repeat(50));
console.log(`   Key   : ${adminKey.key}`);
console.log(`   Role  : ${adminKey.role}`);
console.log(`   Label : ${adminKey.label}`);
console.log('━'.repeat(50));
console.log('⚠️  Simpan key ini sekarang. Tidak akan ditampilkan lagi.\n');

// 2. Buat .env jika belum ada
if (!fs.existsSync(ENV_FILE)) {
  const envContent = `# Konfigurasi Carbone API
PORT=3000

# Opsional: daftar IP yang boleh akses /api/keys (kosongkan = semua IP boleh)
ADMIN_WHITELIST_IPS=

# Opsional: nama environment
NODE_ENV=development
`;
  fs.writeFileSync(ENV_FILE, envContent, 'utf8');
  console.log('✅ File .env dibuat.\n');
} else {
  console.log('ℹ️  File .env sudah ada, dilewati.\n');
}

console.log('🚀 Siap! Jalankan server dengan: npm start\n');
console.log('📡 Gunakan key di atas untuk membuat key baru via:');
console.log('   POST /api/keys  (dengan header x-api-key: <key-admin>)\n');
