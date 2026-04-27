/**
 * contoh-pemakaian.js
 *
 * Contoh memanggil Carbone API dari aplikasi Node.js lain — dengan autentikasi.
 *
 * Urutan penggunaan pertama kali:
 *   1. node scripts/setup.js     ← buat admin key pertama
 *   2. npm start                 ← jalankan server
 *   3. node contoh-pemakaian.js  ← coba semua endpoint
 */

const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

// ⚠️  Ganti dengan key Anda dari output `node scripts/setup.js`
const ADMIN_KEY = process.env.ADMIN_KEY || 'cr_GANTI_DENGAN_KEY_ADMIN_ANDA';
const USER_KEY  = process.env.USER_KEY  || ADMIN_KEY;

// ── Helper ─────────────────────────────────────────────────────────────────────

async function api(method, endpoint, body, apiKey = USER_KEY) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${endpoint}`, opts);
  return res.json();
}

async function downloadFile(url, savePath, apiKey = USER_KEY) {
  const res = await fetch(`${BASE_URL}${url}`, { headers: { 'x-api-key': apiKey } });
  if (!res.ok) throw new Error('Download gagal: ' + res.status);
  fs.writeFileSync(savePath, Buffer.from(await res.arrayBuffer()));
}

// ── Contoh 1: Kelola API Key (admin) ──────────────────────────────────────────

async function contohKelolaKey() {
  console.log('\n🔑 Contoh 1: Kelola API Key (admin)...');
  const buatKey = await api('POST', '/api/keys', { label: 'Aplikasi Frontend', role: 'user' }, ADMIN_KEY);
  console.log('Buat key baru:', buatKey.success ? buatKey.data.key : buatKey.error);
  const daftarKey = await api('GET', '/api/keys', null, ADMIN_KEY);
  console.log('Total key:', daftarKey.total);
  daftarKey.data?.forEach(k => console.log(' -', k.label, '|', k.role, '|', k.active ? 'aktif' : 'nonaktif'));
}

// ── Contoh 2: Generate Invoice ────────────────────────────────────────────────

async function contohGenerateInvoice() {
  console.log('\n🧾 Contoh 2: Generate Invoice...');
  const hasil = await api('POST', '/api/reports/generate', {
    template: 'invoice.odt',
    data: {
      nomor_invoice: 'INV-2026-0042',
      tanggal: '27 April 2026',
      pelanggan: { nama: 'PT. Maju Bersama', kota: 'Salatiga' },
      items: [
        { no: 1, deskripsi: 'Jasa Konsultasi IT', total: 'Rp 4.500.000' },
        { no: 2, deskripsi: 'Pengembangan Website', total: 'Rp 8.000.000' },
      ],
      total: 'Rp 12.500.000',
    },
  });
  console.log(hasil.success ? '✅ Berhasil: ' + hasil.data.downloadUrl : '❌ Gagal: ' + hasil.error);
}

// ── Contoh 3: Request tanpa key → harus ditolak ───────────────────────────────

async function contohTanpaKey() {
  console.log('\n🚫 Contoh 3: Request tanpa API key (harus 401)...');
  const res  = await fetch(`${BASE_URL}/api/templates`);
  const body = await res.json();
  console.log('   Status:', res.status, '—', body.error);
}

// ── Main ───────────────────────────────────────────────────────────────────────

(async () => {
  try {
    const health = await fetch(`${BASE_URL}/health`).then(r => r.json());
    console.log('🟢 Server aktif:', health.service);
    if (ADMIN_KEY.includes('GANTI')) {
      console.log('\n⚠️  Set ADMIN_KEY dulu. Jalankan: node scripts/setup.js\n');
      return;
    }
    await contohTanpaKey();
    await contohKelolaKey();
    await contohGenerateInvoice();
    console.log('\n🎉 Selesai!\n');
  } catch (err) {
    console.error('\n❌ Error:', err.message, '\nPastikan server sudah berjalan: npm start\n');
  }
})();
