const express = require('express');
const db = require('../db');
const bus = require('../events');

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
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      // If already exists, update the empresa assignment
      db.prepare('UPDATE company_rfcs SET empresa = ? WHERE rfc = ?').run(empresa, rfc);
    } else {
      throw err;
    }
  }

  // Reassign existing invoices that have this RFC as emisor
  const result = db.prepare(
    'UPDATE invoices SET empresa = ?, updated_at = datetime(\'now\') WHERE rfc_emisor = ?'
  ).run(empresa, rfc);

  res.json({ ok: true, reassigned: result.changes });
  bus.emit('settings:changed');
  if (result.changes > 0) bus.emit('invoices:changed');
});

// POST /api/settings/reassign — re-scan all invoices against current RFC config
router.post('/reassign', (req, res) => {
  const rfcMap = db.prepare('SELECT rfc, empresa FROM company_rfcs').all();
  let total = 0;
  const reassignOne = db.prepare(
    'UPDATE invoices SET empresa = ?, updated_at = datetime(\'now\') WHERE rfc_emisor = ? AND empresa != ?'
  );
  const tx = db.transaction(() => {
    for (const { rfc, empresa } of rfcMap) {
      const r = reassignOne.run(empresa, rfc, empresa);
      total += r.changes;
    }
  });
  tx();
  res.json({ ok: true, reassigned: total });
  if (total > 0) bus.emit('invoices:changed');
});

// DELETE /api/settings/rfcs/:id
router.delete('/rfcs/:id', (req, res) => {
  db.prepare('DELETE FROM company_rfcs WHERE id = ?').run(parseInt(req.params.id));
  res.json({ ok: true });
  bus.emit('settings:changed');
});

module.exports = router;
