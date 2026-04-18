const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/aliases
router.get('/', (req, res) => {
  const aliases = db.prepare('SELECT * FROM client_aliases ORDER BY alias').all();
  res.json(aliases);
});

// POST /api/aliases — upsert by nombre_receptor
router.post('/', (req, res) => {
  const { nombre_receptor, alias, rfc_receptor } = req.body;
  if (!nombre_receptor || !alias) {
    return res.status(400).json({ error: 'Nombre y alias son requeridos' });
  }

  db.prepare(
    `INSERT INTO client_aliases (nombre_receptor, rfc_receptor, alias)
     VALUES (@nombre_receptor, @rfc_receptor, @alias)
     ON CONFLICT(nombre_receptor) DO UPDATE SET
       alias = excluded.alias,
       rfc_receptor = excluded.rfc_receptor`
  ).run({
    nombre_receptor,
    rfc_receptor: rfc_receptor || null,
    alias,
  });

  res.json({ ok: true });
});

// DELETE /api/aliases/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM client_aliases WHERE id = ?').run(parseInt(req.params.id));
  res.json({ ok: true });
});

module.exports = router;
