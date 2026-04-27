# 📄 Carbone Report API

REST API untuk generate laporan (PDF, DOCX, XLSX, dll.) menggunakan [Carbone.io](https://carbone.io).

## 🚀 Instalasi & Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Jalankan server (production)
npm start

# 3. Atau mode development (auto-restart saat file berubah, Node.js >= 18)
npm run dev
```

Server berjalan di: `http://localhost:3000`

---

## 📁 Struktur Folder

```
carbone-api/
├── src/
│   ├── server.js          ← Entry point Express
│   └── routes/
│       ├── report.js      ← Endpoint generate & download report
│       └── template.js    ← Endpoint kelola template
├── templates/             ← Letakkan file template di sini (.odt, .docx, .xlsx, dll.)
├── output/                ← File hasil render (auto-hapus setelah 10 menit)
├── contoh-pemakaian.js    ← Contoh memanggil API dari Node.js
└── package.json
```

---

## 📡 Endpoint API

### Health Check
```
GET /health
```

### Template

| Method | Endpoint | Keterangan |
|--------|----------|-----------|
| GET | `/api/templates` | List semua template |
| POST | `/api/templates/upload` | Upload template baru |
| DELETE | `/api/templates/:nama` | Hapus template |

### Report

| Method | Endpoint | Keterangan |
|--------|----------|-----------|
| POST | `/api/reports/generate` | Generate report baru |
| GET | `/api/reports/download/:filename` | Download hasil report |

---

## 📖 Cara Pakai

### 1. Upload Template

```bash
curl -X POST http://localhost:3000/api/templates/upload \
  -F "template=@./invoice.odt"
```

### 2. Generate Report

```bash
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "template": "invoice.odt",
    "convertTo": "pdf",
    "data": {
      "nomor": "INV-001",
      "pelanggan": "PT. Maju Bersama",
      "total": "Rp 5.000.000"
    }
  }'
```

Response:
```json
{
  "success": true,
  "message": "Report berhasil dibuat.",
  "data": {
    "filename": "report_uuid-xxx.pdf",
    "format": "pdf",
    "downloadUrl": "/api/reports/download/report_uuid-xxx.pdf",
    "expiresInMinutes": 10
  }
}
```

### 3. Download Report

```bash
curl -O http://localhost:3000/api/reports/download/report_uuid-xxx.pdf
```

---

## 🔖 Sintaks Template Carbone

| Marker di Template | Keterangan |
|-------------------|-----------|
| `{d.nama}` | Nilai dari field `nama` |
| `{d.pelanggan.kota}` | Nested object |
| `{d.items[i].nama}` | Loop array — taruh di baris tabel |
| `{d.harga \| formatN(0, ',', '.')}` | Format angka: `1.500.000` |
| `{d.tanggal \| formatD('DD/MM/YYYY')}` | Format tanggal |
| `{d.nilai \| ifEQ(1, 'Aktif', 'Nonaktif')}` | Kondisional |

---

## ⚙️ Konfigurasi Port

Ubah port via environment variable:

```bash
PORT=8080 node src/server.js
```

---

## 📝 Catatan

- **PDF conversion** membutuhkan **LibreOffice** terinstall di server.
- File output **otomatis dihapus** setelah 10 menit. Download segera setelah generate.
- Ukuran template maksimal: **20 MB**.
- Format yang didukung: `.odt`, `.docx`, `.ods`, `.xlsx`, `.odp`, `.pptx`
