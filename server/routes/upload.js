const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { parseCFDI } = require('../utils/xmlParser');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      path.extname(file.originalname).toLowerCase() === '.xml' ||
      file.mimetype === 'text/xml' ||
      file.mimetype === 'application/xml'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos XML'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const insertInvoice = db.prepare(`
  INSERT INTO invoices (
    empresa, uuid, serie, folio, fecha_emision, moneda, tipo_cambio,
    subtotal, iva, iva_retenido, total,
    rfc_emisor, nombre_emisor, rfc_receptor, nombre_receptor,
    concepto, metodo_pago, forma_pago, uso_cfdi, xml_filename
  ) VALUES (
    @empresa, @uuid, @serie, @folio, @fecha_emision, @moneda, @tipo_cambio,
    @subtotal, @iva, @iva_retenido, @total,
    @rfc_emisor, @nombre_emisor, @rfc_receptor, @nombre_receptor,
    @concepto, @metodo_pago, @forma_pago, @uso_cfdi, @xml_filename
  )
`);

const checkUUID = db.prepare('SELECT id FROM invoices WHERE uuid = ?');
const findCompany = db.prepare('SELECT empresa FROM company_rfcs WHERE rfc = ?');

router.post('/', upload.array('files', 500), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No se recibieron archivos' });
  }

  const empresaOverride = req.body.empresa; // 'DLG' or 'SMGS' if manually selected
  const results = { insertados: 0, duplicados: 0, errores: [] };

  const insertMany = db.transaction((files) => {
    for (const file of files) {
      try {
        const xmlContent = file.buffer.toString('utf-8');
        const data = parseCFDI(xmlContent, file.originalname);

        // Check duplicate
        if (checkUUID.get(data.uuid)) {
          results.duplicados++;
          continue;
        }

        // Determine empresa
        let empresa = empresaOverride || null;
        if (!empresa) {
          const companyRow = findCompany.get(data.rfc_emisor);
          empresa = companyRow ? companyRow.empresa : null;
        }

        if (!empresa) {
          results.errores.push({
            archivo: file.originalname,
            error: `RFC emisor ${data.rfc_emisor} no registrado. Selecciona la empresa manualmente.`,
          });
          continue;
        }

        insertInvoice.run({ ...data, empresa });
        results.insertados++;
      } catch (err) {
        results.errores.push({
          archivo: file.originalname,
          error: err.message,
        });
      }
    }
  });

  insertMany(req.files);

  res.json(results);
});

module.exports = router;
