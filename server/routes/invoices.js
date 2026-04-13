const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/invoices?empresa=DLG&estado=PENDIENTE&search=...&moneda=MXN
//   &fecha_desde=...&fecha_hasta=...&fecha_tent_desde=...&fecha_tent_hasta=...
//   &cliente=...&page=1&limit=50&sort=fecha_emision&order=desc
router.get('/', (req, res) => {
  const {
    empresa,
    estado,
    search,
    moneda,
    fecha_desde,
    fecha_hasta,
    fecha_tent_desde,
    fecha_tent_hasta,
    cliente,
    page = 1,
    limit = 50,
    sort = 'fecha_emision',
    order = 'desc',
  } = req.query;

  // Base conditions: all filters EXCEPT estado (used for both paginated data and alerts)
  const baseConditions = [];
  const baseParams = {};

  if (empresa) {
    baseConditions.push('i.empresa = @empresa');
    baseParams.empresa = empresa;
  }

  if (moneda && moneda !== 'Todas') {
    baseConditions.push('i.moneda = @moneda');
    baseParams.moneda = moneda;
  }

  if (fecha_desde) {
    baseConditions.push('i.fecha_emision >= @fecha_desde');
    baseParams.fecha_desde = fecha_desde;
  }

  if (fecha_hasta) {
    baseConditions.push('i.fecha_emision <= @fecha_hasta');
    baseParams.fecha_hasta = fecha_hasta;
  }

  if (fecha_tent_desde) {
    baseConditions.push('i.fecha_tentativa_pago >= @fecha_tent_desde');
    baseParams.fecha_tent_desde = fecha_tent_desde;
  }

  if (fecha_tent_hasta) {
    baseConditions.push('i.fecha_tentativa_pago <= @fecha_tent_hasta');
    baseParams.fecha_tent_hasta = fecha_tent_hasta;
  }

  if (cliente) {
    baseConditions.push('(i.nombre_receptor = @cliente OR i.rfc_receptor IN (SELECT rfc_receptor FROM client_aliases WHERE alias = @cliente))');
    baseParams.cliente = cliente;
  }

  if (search) {
    baseConditions.push(`(
      i.nombre_receptor LIKE @search OR
      i.rfc_receptor LIKE @search OR
      i.concepto LIKE @search OR
      i.proyecto LIKE @search OR
      i.folio LIKE @search OR
      i.comentarios LIKE @search OR
      i.serie LIKE @search OR
      i.rfc_receptor IN (SELECT rfc_receptor FROM client_aliases WHERE alias LIKE @search)
    )`);
    baseParams.search = `%${search}%`;
  }

  const baseWhere = baseConditions.length > 0 ? 'WHERE ' + baseConditions.join(' AND ') : '';

  // SQL expression that mirrors computeEstadoVisual logic
  const estadoSqlExpr = `
    CASE
      WHEN i.estado = 'CANCELADA' THEN 'CANCELADA'
      WHEN i.estado = 'PAGADO' THEN 'PAGADO'
      WHEN i.fecha_tentativa_pago IS NULL AND
           CAST(julianday(date('now')) - julianday(date(COALESCE(i.created_at, i.fecha_emision))) AS INTEGER) >= 7
           THEN 'SIN FECHA'
      WHEN i.fecha_tentativa_pago IS NULL THEN 'PENDIENTE'
      WHEN date(i.fecha_tentativa_pago) < date('now') THEN 'VENCIDO'
      WHEN CAST(julianday(date(i.fecha_tentativa_pago)) - julianday(date('now')) AS INTEGER) <= 7 THEN 'PROXIMO A VENCER'
      ELSE 'ON TRACK'
    END`;

  // Build params and estado filter for CTE outer query
  const params = { ...baseParams };
  const estadoWhere = (estado && estado !== 'TODOS')
    ? 'WHERE estado_visual = @estado_filter'
    : '';
  if (estado && estado !== 'TODOS') {
    params.estado_filter = estado;
  }

  // Validate sort column
  const allowedSorts = [
    'fecha_emision', 'folio', 'uuid', 'nombre_receptor', 'total', 'subtotal',
    'fecha_tentativa_pago', 'estado', 'proyecto', 'moneda', 'created_at',
  ];
  const sortCol = allowedSorts.includes(sort) ? sort : 'fecha_emision';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  // Count using CTE so estado filter is applied before counting
  const countRow = db.prepare(`
    WITH base AS (
      SELECT (${estadoSqlExpr}) AS estado_visual
      FROM invoices i
      ${baseWhere}
    )
    SELECT COUNT(*) as total FROM base
    ${estadoWhere}
  `).get(params);

  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Paginated data using CTE with estado_visual computed in SQL
  const rows = db.prepare(`
    WITH base AS (
      SELECT i.*, ca.alias AS cliente_alias,
        (${estadoSqlExpr}) AS estado_visual
      FROM invoices i
      LEFT JOIN client_aliases ca ON ca.rfc_receptor = i.rfc_receptor
      ${baseWhere}
    )
    SELECT * FROM base
    ${estadoWhere}
    ORDER BY ${sortCol} ${sortOrder}
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit: parseInt(limit), offset });

  const enriched = rows.map((row) => ({
    ...row,
    nombre_display: row.cliente_alias || row.nombre_receptor,
  }));

  // Alert rows: all base-filtered invoices excluding PAGADO/CANCELADA (no pagination, no estado filter)
  const today = new Date().toISOString().substring(0, 10);
  const alertWhere = baseConditions.length > 0
    ? 'WHERE ' + baseConditions.join(' AND ') + " AND i.estado NOT IN ('PAGADO', 'CANCELADA')"
    : "WHERE i.estado NOT IN ('PAGADO', 'CANCELADA')";

  const alertRows = db
    .prepare(
      `SELECT i.*, ca.alias AS cliente_alias FROM invoices i
       LEFT JOIN client_aliases ca ON ca.rfc_receptor = i.rfc_receptor
       ${alertWhere}
       ORDER BY i.fecha_tentativa_pago ASC`
    )
    .all(baseParams);

  const alertEnriched = alertRows.map((row) => ({
    ...row,
    nombre_display: row.cliente_alias || row.nombre_receptor,
    estado_visual: computeEstadoVisual(row, today),
  }));

  const alerts = {
    sinFecha: alertEnriched.filter((r) => r.estado_visual === 'SIN FECHA'),
    proxVencer: alertEnriched.filter((r) => r.estado_visual === 'PROXIMO A VENCER'),
    vencidas: alertEnriched.filter((r) => r.estado_visual === 'VENCIDO'),
  };

  // Get unique clients for this empresa (using alias when available)
  const clientesQuery = empresa
    ? `SELECT DISTINCT COALESCE(ca.alias, i.nombre_receptor) AS nombre
       FROM invoices i LEFT JOIN client_aliases ca ON ca.rfc_receptor = i.rfc_receptor
       WHERE i.empresa = ? ORDER BY nombre`
    : `SELECT DISTINCT COALESCE(ca.alias, i.nombre_receptor) AS nombre
       FROM invoices i LEFT JOIN client_aliases ca ON ca.rfc_receptor = i.rfc_receptor
       ORDER BY nombre`;
  const clientes = empresa
    ? db.prepare(clientesQuery).all(empresa).map((r) => r.nombre)
    : db.prepare(clientesQuery).all().map((r) => r.nombre);

  res.json({
    data: enriched,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: countRow.total,
      pages: Math.ceil(countRow.total / parseInt(limit)),
    },
    clientes,
    alerts,
  });
});

// PATCH /api/invoices/:id - Update manual fields
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { proyecto, fecha_tentativa_pago, comentarios, estado, fecha_pago } =
    req.body;

  const updates = [];
  const params = { id: parseInt(id) };

  if (proyecto !== undefined) {
    updates.push('proyecto = @proyecto');
    params.proyecto = proyecto;
  }
  if (fecha_tentativa_pago !== undefined) {
    updates.push('fecha_tentativa_pago = @fecha_tentativa_pago');
    params.fecha_tentativa_pago = fecha_tentativa_pago || null;
  }
  if (comentarios !== undefined) {
    updates.push('comentarios = @comentarios');
    params.comentarios = comentarios;
  }
  if (estado !== undefined) {
    updates.push('estado = @estado');
    params.estado = estado;
  }
  if (fecha_pago !== undefined) {
    updates.push('fecha_pago = @fecha_pago');
    params.fecha_pago = fecha_pago || null;
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }

  updates.push("updated_at = datetime('now')");

  db.prepare(
    `UPDATE invoices SET ${updates.join(', ')} WHERE id = @id`
  ).run(params);

  const updated = db.prepare(
    `SELECT i.*, ca.alias AS cliente_alias FROM invoices i
     LEFT JOIN client_aliases ca ON ca.rfc_receptor = i.rfc_receptor
     WHERE i.id = ?`
  ).get(parseInt(id));
  const today = new Date().toISOString().substring(0, 10);
  res.json({ ...updated, nombre_display: updated.cliente_alias || updated.nombre_receptor, estado_visual: computeEstadoVisual(updated, today) });
});

// POST /api/invoices/bulk-delete
router.post('/bulk-delete', (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de IDs' });
  }
  const placeholders = ids.map(() => '?').join(',');
  const result = db.prepare(`DELETE FROM invoices WHERE id IN (${placeholders})`).run(...ids.map(Number));
  res.json({ deleted: result.changes });
});

// DELETE /api/invoices/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM invoices WHERE id = ?').run(parseInt(req.params.id));
  res.json({ ok: true });
});

function computeEstadoVisual(row, today) {
  if (row.estado === 'CANCELADA') return 'CANCELADA';
  if (row.estado === 'PAGADO') return 'PAGADO';

  if (!row.fecha_tentativa_pago) {
    const createdDate = row.created_at
      ? row.created_at.substring(0, 10)
      : row.fecha_emision;
    const diffDays = daysDiff(createdDate, today);
    if (diffDays >= 7) return 'SIN FECHA';
    return 'PENDIENTE';
  }

  const tentativa = row.fecha_tentativa_pago;
  if (tentativa < today) return 'VENCIDO';

  const daysUntil = daysDiff(today, tentativa);
  if (daysUntil <= 7) return 'PROXIMO A VENCER';

  return 'ON TRACK';
}

function daysDiff(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

module.exports = router;
module.exports.computeEstadoVisual = computeEstadoVisual;
