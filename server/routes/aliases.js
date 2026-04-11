const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/aliases
router.get('/', (req, res) => {
  const aliases = db.prepare('SELECT * FROM client_aliases ORDER BY alias').all();
  res.json(aliases);
});

// POST /api/aliases — upsert by rfc_receptor
router.post('/', (req, res) => {
  const { rfc_receptor, alias, nombre_original } = req.body;
  if (!rfc_receptor || !alias) {
    return res.status(400).json({ error: 'RFC y alias son requeridos' });
  }

  const existing = db.prepare('SELECT id FROM client_aliases WHERE rfc_receptor = ?').get(rfc_receptor);
  if (existing) {
    db.prepare('UPDATE client_aliases SET alias = ?, nombre_original = ? WHERE id = ?')
      .run(alias, nombre_original || null, existing.id);
  } else {
    db.prepare('INSERT INTO client_aliases (rfc_receptor, alias, nombre_original) VALUES (?, ?, ?)')
      .run(rfc_receptor, alias, nombre_original || null);
  }

  res.json({ ok: true });
});

// DELETE /api/aliases/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM client_aliases WHERE id = ?').run(parseInt(req.params.id));
  res.json({ ok: true });
});

module.exports = router;
