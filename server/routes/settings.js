const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/settings/rfcs
router.get('/rfcs', (req, res) => {
  const rfcs = db.prepare('SELECT * FROM company_rfcs ORDER BY empresa, rfc').all();
  res.json(rfcs);
});

// POST /api/settings/rfcs
router.post('/rfcs', (req, res) => {
  const { rfc, empresa } = req.body;
  if (!rfc || !empresa) {
    return res.status(400).json({ error: 'RFC y empresa son requeridos' });
  }
  if (!['DLG', 'SMGS'].includes(empresa)) {
    return res.status(400).json({ error: 'Empresa debe ser DLG o SMGS' });
  }
  try {
    db.prepare('INSERT INTO company_rfcs (rfc, empresa) VALUES (?, ?)').run(rfc, empresa);
    res.json({ ok: true });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Este RFC ya está registrado' });
    }
    throw err;
  }
});

// DELETE /api/settings/rfcs/:id
router.delete('/rfcs/:id', (req, res) => {
  db.prepare('DELETE FROM company_rfcs WHERE id = ?').run(parseInt(req.params.id));
  res.json({ ok: true });
});

module.exports = router;
