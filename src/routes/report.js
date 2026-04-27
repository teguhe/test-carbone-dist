const express = require('express');
const router = express.Router();
const carbone = require('carbone');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const TEMPLATE_DIR = path.join(__dirname, '..', '..', 'templates');
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output');

/**
 * POST /api/reports/generate
 *
 * Body JSON:
 * {
 *   "template": "invoice.odt",      // nama file template di folder /templates
 *   "data": { ... },                // data yang akan diinjeksi
 *   "convertTo": "pdf",             // opsional: "pdf", "docx", "xlsx", dll.
 *   "options": { ... }              // opsional: carbone options tambahan
 * }
 */
router.post('/generate', async (req, res, next) => {
  try {
    const { template, data, convertTo, options = {} } = req.body;

    // Validasi input
    if (!template) {
      return res.status(400).json({ success: false, error: 'Field "template" wajib diisi.' });
    }
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, error: 'Field "data" wajib berupa object JSON.' });
    }

    const templatePath = path.join(TEMPLATE_DIR, template);

    // Cek apakah template ada
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({
        success: false,
        error: `Template "${template}" tidak ditemukan. Upload dulu via POST /api/templates/upload`,
      });
    }

    // Tentukan ekstensi output
    const templateExt = path.extname(template).slice(1);
    const outputExt = convertTo || templateExt;

    // Buat nama file output unik
    const outputFilename = `report_${uuidv4()}.${outputExt}`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    // Carbone render options
    const carboneOptions = {
      ...options,
      ...(convertTo ? { convertTo } : {}),
    };

    // Render report
    carbone.render(templatePath, data, carboneOptions, (err, result) => {
      if (err) {
        console.error('[Carbone Error]', err);
        return next({ status: 500, message: `Gagal render report: ${err.message}` });
      }

      // Simpan file output
      fs.writeFileSync(outputPath, result);

      // Auto-hapus file setelah 10 menit
      setTimeout(() => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }, 10 * 60 * 1000);

      return res.json({
        success: true,
        message: 'Report berhasil dibuat.',
        data: {
          filename: outputFilename,
          format: outputExt,
          downloadUrl: `/api/reports/download/${outputFilename}`,
          expiresInMinutes: 10,
        },
      });
    });

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/download/:filename
 * Download file hasil render
 */
router.get('/download/:filename', (req, res, next) => {
  try {
    const { filename } = req.params;

    // Cegah path traversal
    const safeName = path.basename(filename);
    const filePath = path.join(OUTPUT_DIR, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File tidak ditemukan atau sudah kedaluwarsa (10 menit).',
      });
    }

    res.download(filePath, safeName, (err) => {
      if (err) next(err);
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
