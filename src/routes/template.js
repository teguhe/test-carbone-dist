const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const TEMPLATE_DIR = path.join(__dirname, '..', '..', 'templates');

// Ekstensi yang diizinkan
const ALLOWED_EXT = ['.odt', '.docx', '.ods', '.xlsx', '.odp', '.pptx'];

// Konfigurasi multer — simpan ke folder templates
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMPLATE_DIR),
  filename: (req, file, cb) => {
    // Gunakan nama asli file, sanitasi karakter berbahaya
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXT.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Ekstensi tidak didukung. Gunakan: ${ALLOWED_EXT.join(', ')}`));
    }
  },
});

/**
 * GET /api/templates
 * List semua template yang tersedia
 */
router.get('/', (req, res) => {
  const files = fs.readdirSync(TEMPLATE_DIR)
    .filter(f => ALLOWED_EXT.includes(path.extname(f).toLowerCase()))
    .map(f => {
      const stats = fs.statSync(path.join(TEMPLATE_DIR, f));
      return {
        nama: f,
        ukuran: `${(stats.size / 1024).toFixed(1)} KB`,
        diupload: stats.mtime.toISOString(),
      };
    });

  res.json({
    success: true,
    total: files.length,
    templates: files,
  });
});

/**
 * POST /api/templates/upload
 * Upload file template (multipart/form-data, field: "template")
 */
router.post('/upload', upload.single('template'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Tidak ada file yang diupload. Gunakan field "template".' });
  }

  res.json({
    success: true,
    message: 'Template berhasil diupload.',
    data: {
      nama: req.file.filename,
      ukuran: `${(req.file.size / 1024).toFixed(1)} KB`,
    },
  });
});

/**
 * DELETE /api/templates/:nama
 * Hapus template
 */
router.delete('/:nama', (req, res, next) => {
  try {
    const safeName = path.basename(req.params.nama);
    const filePath = path.join(TEMPLATE_DIR, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: `Template "${safeName}" tidak ditemukan.` });
    }

    fs.unlinkSync(filePath);
    res.json({ success: true, message: `Template "${safeName}" berhasil dihapus.` });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
