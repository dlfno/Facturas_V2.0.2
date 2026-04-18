const express = require('express');
const db = require('../db');
const { buildBaseFilters, buildEstadoFilter, estadoSqlExpr } = require('../utils/invoiceFilters');
const { detectRezagadas } = require('../utils/rezagadas');

const router = express.Router();

// Convierte a MXN. `total` siempre se asume en la moneda de la factura.
function toMXN(val, inv) {
  if (!val) return 0;
  if (inv.moneda === 'USD') return val * (inv.tipo_cambio || 1);
  return val;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// GET /api/dashboard — KPIs del dashboard con filtros combinables.
// Params: empresa, estado, moneda, search, fecha_desde, fecha_hasta,
//         fecha_tent_desde, fecha_tent_hasta, clientes (pipe-separated).
router.get('/', (req, res) => {
  const {
    empresa,
    estado,
    estados,
    moneda,
    search,
    fecha_desde,
    fecha_hasta,
    fecha_tent_desde,
    fecha_tent_hasta,
    clientes: clientesParam,
  } = req.query;

  // Paginación por sección. Cada lista del response se sirve en páginas de
  // SECTION_LIMIT filas; el cliente las recarga pasando *Page.
  const SECTION_LIMIT = 20;
  const proximasPage = Math.max(1, parseInt(req.query.proximasPage) || 1);
  const revisionPage = Math.max(1, parseInt(req.query.revisionPage) || 1);
  const pendientesPage = Math.max(1, parseInt(req.query.pendientesPage) || 1);
  const vencidasPage = Math.max(1, parseInt(req.query.vencidasPage) || 1);
  const sliceSection = (arr, page) => arr.slice((page - 1) * SECTION_LIMIT, page * SECTION_LIMIT);

  // clientesList se calcula con el filtro de empresa únicamente (no con los filtros
  // de fecha/estado), para que el selector no oculte opciones al filtrar.
  const empresaFilter = buildBaseFilters({ empresa });
  const clientesListRows = db
    .prepare(
      `SELECT DISTINCT i.nombre_receptor AS key, COALESCE(a.alias, i.nombre_receptor) AS label
       FROM invoices i
       LEFT JOIN client_aliases a ON a.nombre_receptor = i.nombre_receptor
       ${empresaFilter.where}`
    )
    .all(empresaFilter.params);
  const clientesList = clientesListRows.sort((a, b) => a.label.localeCompare(b.label, 'es'));

  // Filtros completos (base + estado post-CTE).
  const { params: baseParams, where: baseWhere } = buildBaseFilters({
    empresa, moneda, fecha_desde, fecha_hasta, fecha_tent_desde, fecha_tent_hasta,
    search, clientes: clientesParam,
  });

  const estadoFilter = buildEstadoFilter(estados || estado);
  const estadoWhere = estadoFilter.where;
  const params = { ...baseParams, ...estadoFilter.params };

  const rows = db
    .prepare(
      `WITH base AS (
         SELECT i.*, COALESCE(a.alias, i.nombre_receptor) AS nombre_display,
           (${estadoSqlExpr}) AS estado_visual
         FROM invoices i
         LEFT JOIN client_aliases a ON a.nombre_receptor = i.nombre_receptor
         ${baseWhere}
       )
       SELECT * FROM base
       ${estadoWhere}`
    )
    .all(params);

  // KPIs de dinero: con IVA (total) y sin IVA (subtotal), en MXN.
  // "Facturado" excluye canceladas pero incluye pagadas.
  const noCanceladas = rows.filter((i) => i.estado !== 'CANCELADA');
  const totalFacturadoConIVA = noCanceladas.reduce((s, i) => s + toMXN(i.total, i), 0);
  const totalFacturadoSinIVA = noCanceladas.reduce((s, i) => s + toMXN(i.subtotal, i), 0);

  const pagadas = rows.filter((i) => i.estado === 'PAGADO');
  const totalCobradoConIVA = pagadas.reduce((s, i) => s + toMXN(i.total, i), 0);
  const totalCobradoSinIVA = pagadas.reduce((s, i) => s + toMXN(i.subtotal, i), 0);

  const pendientes = rows.filter((i) => !['PAGADO', 'CANCELADA'].includes(i.estado));
  const totalPendienteConIVA = pendientes.reduce((s, i) => s + toMXN(i.total, i), 0);
  const totalPendienteSinIVA = pendientes.reduce((s, i) => s + toMXN(i.subtotal, i), 0);

  // Conteo de facturas, con desglose canceladas/activas.
  const totalFacturas = rows.length;
  const totalCanceladas = rows.filter((i) => i.estado === 'CANCELADA').length;
  const totalActivas = totalFacturas - totalCanceladas;

  // Conteos por estado_visual (ya computado en SQL).
  const statusCounts = {};
  for (const inv of rows) {
    statusCounts[inv.estado_visual] = (statusCounts[inv.estado_visual] || 0) + 1;
  }

  // Facturación mensual (excluyendo canceladas).
  const monthlyData = {};
  for (const inv of noCanceladas) {
    const month = (inv.fecha_emision || '').substring(0, 7);
    if (!month) continue;
    monthlyData[month] = (monthlyData[month] || 0) + toMXN(inv.total, inv);
  }
  const monthlyChart = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, monto]) => ({ mes, monto: round2(monto) }));

  // Top 10 clientes por monto pendiente (con IVA para el ranking).
  const clientePendienteConIVA = {};
  const clientePendienteSinIVA = {};
  for (const inv of pendientes) {
    const name = inv.nombre_receptor;
    clientePendienteConIVA[name] = (clientePendienteConIVA[name] || 0) + toMXN(inv.total, inv);
    clientePendienteSinIVA[name] = (clientePendienteSinIVA[name] || 0) + toMXN(inv.subtotal, inv);
  }
  const topClientesFull = Object.entries(clientePendienteConIVA)
    .sort(([, a], [, b]) => b - a)
    .map(([cliente, monto]) => ({
      cliente,
      monto: round2(monto),
      montoSinIVA: round2(clientePendienteSinIVA[cliente] || 0),
    }));
  const topClientes = topClientesFull.slice(0, 10);
  const topClientesTotal = round2(topClientes.reduce((s, c) => s + c.monto, 0));
  const topClientesTotalSinIVA = round2(topClientes.reduce((s, c) => s + c.montoSinIVA, 0));
  const topClientesGrandTotal = round2(topClientesFull.reduce((s, c) => s + c.monto, 0));
  const topClientesGrandTotalSinIVA = round2(topClientesFull.reduce((s, c) => s + c.montoSinIVA, 0));

  // Listas de alertas.
  const proximasVencer = rows
    .filter((i) => i.estado_visual === 'PROXIMO A VENCER')
    .sort((a, b) => (a.fecha_tentativa_pago || '').localeCompare(b.fecha_tentativa_pago || ''));
  const revision = rows
    .filter((i) => i.estado_visual === 'REVISIÓN')
    .sort((a, b) => (a.fecha_emision || '').localeCompare(b.fecha_emision || ''));
  const pendientesEstado = rows
    .filter((i) => i.estado_visual === 'PENDIENTE')
    .sort((a, b) => (a.fecha_emision || '').localeCompare(b.fecha_emision || ''));
  // Legacy: sinFecha combinaba REVISIÓN + PENDIENTE sin fecha tentativa.
  const sinFecha = revision;
  const vencidas = rows
    .filter((i) => i.estado_visual === 'VENCIDO')
    .sort((a, b) => (a.fecha_tentativa_pago || '').localeCompare(b.fecha_tentativa_pago || ''));

  res.json({
    kpis: {
      totalFacturadoConIVA: round2(totalFacturadoConIVA),
      totalFacturadoSinIVA: round2(totalFacturadoSinIVA),
      totalCobradoConIVA: round2(totalCobradoConIVA),
      totalCobradoSinIVA: round2(totalCobradoSinIVA),
      totalPendienteConIVA: round2(totalPendienteConIVA),
      totalPendienteSinIVA: round2(totalPendienteSinIVA),
      totalFacturas,
      totalActivas,
      totalCanceladas,
      sinFechaCount: statusCounts['REVISIÓN'] || 0,
      vencidasCount: statusCounts['VENCIDO'] || 0,
      proximasCount: statusCounts['PROXIMO A VENCER'] || 0,
    },
    statusCounts,
    monthlyChart,
    topClientes,
    topClientesTotal,
    topClientesTotalSinIVA,
    topClientesGrandTotal,
    topClientesGrandTotalSinIVA,
    proximasVencer: sliceSection(proximasVencer, proximasPage),
    proximasVencerTotal: proximasVencer.length,
    proximasVencerPage: proximasPage,
    revision: sliceSection(revision, revisionPage),
    revisionTotal: revision.length,
    revisionPage,
    pendientes: sliceSection(pendientesEstado, pendientesPage),
    pendientesTotal: pendientesEstado.length,
    pendientesPage,
    sinFecha: sliceSection(revision, revisionPage),
    sinFechaTotal: revision.length,
    vencidas: sliceSection(vencidas, vencidasPage),
    vencidasTotal: vencidas.length,
    vencidasPage,
    sectionLimit: SECTION_LIMIT,
    clientesList,
  });
});

// GET /api/dashboard/rezagadas?empresa=DLG
// Detecta folios faltantes en la secuencia numérica por (empresa, serie, prefix).
router.get('/rezagadas', (req, res) => {
  const { empresa } = req.query;
  const sql = empresa
    ? 'SELECT empresa, serie, folio, estado FROM invoices WHERE folio IS NOT NULL AND empresa = ? ORDER BY empresa, serie, folio'
    : 'SELECT empresa, serie, folio, estado FROM invoices WHERE folio IS NOT NULL ORDER BY empresa, serie, folio';
  const rows = empresa ? db.prepare(sql).all(empresa) : db.prepare(sql).all();
  res.json(detectRezagadas(rows));
});

module.exports = router;
