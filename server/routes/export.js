const express = require('express');
const ExcelJS = require('exceljs');
const db = require('../db');
const { buildBaseFilters, buildEstadoFilter, estadoSqlExpr } = require('../utils/invoiceFilters');

const router = express.Router();

// Convierte string 'YYYY-MM-DD' o ISO a Date (o null) sin off-by-one por UTC.
function toDate(s) {
  if (!s) return null;
  return new Date(s.substring(0, 10) + 'T00:00:00');
}

// GET /api/export?empresa=DLG&...same filters as invoices...
router.get('/', async (req, res) => {
  const { empresa } = req.query;

  const { params: baseParams, where: baseWhere } = buildBaseFilters(req.query);
  const estadoFilter = buildEstadoFilter(req.query.estados || req.query.estado);

  // Orden ascendente por folio (cast a INTEGER para orden numérico) y luego por serie.
  const rows = db
    .prepare(
      `WITH base AS (
         SELECT i.*, ca.alias AS cliente_alias,
           (${estadoSqlExpr}) AS estado_visual
         FROM invoices i
         LEFT JOIN client_aliases ca ON ca.nombre_receptor = i.nombre_receptor
         ${baseWhere}
       )
       SELECT * FROM base
       ${estadoFilter.where}
       ORDER BY CAST(folio AS INTEGER) ASC, serie ASC`
    )
    .all({ ...baseParams, ...estadoFilter.params });

  // Build Excel
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(empresa || 'Cobranza');

  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  const columns = [
    { header: 'CFDI', key: 'cfdi', width: 10 },
    { header: 'Folio Fiscal', key: 'uuid', width: 38 },
    { header: 'Fecha Emisión', key: 'fecha_emision', width: 14 },
    { header: 'RFC', key: 'rfc_receptor', width: 16 },
    { header: 'Alias', key: 'alias', width: 24 },
    { header: 'Cliente (XML)', key: 'nombre_receptor', width: 30 },
    { header: 'Concepto', key: 'concepto', width: 40 },
    { header: 'Proyecto', key: 'proyecto', width: 20 },
    { header: 'Moneda', key: 'moneda', width: 8 },
    { header: 'T.C.', key: 'tipo_cambio', width: 8 },
    { header: 'Subtotal', key: 'subtotal', width: 15 },
    { header: 'IVA', key: 'iva', width: 15 },
    { header: 'IVA Retenido', key: 'iva_retenido', width: 15 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Fecha Tent. Pago', key: 'fecha_tentativa_pago', width: 16 },
    { header: 'Estado', key: 'estado_visual', width: 18 },
    { header: 'Fecha Pago', key: 'fecha_pago', width: 14 },
    { header: 'Comentarios', key: 'comentarios', width: 30 },
  ];

  sheet.columns = columns;

  // Formatos por columna.
  sheet.getColumn('cfdi').numFmt = '0';
  sheet.getColumn('fecha_emision').numFmt = 'dd/mm/yyyy';
  sheet.getColumn('fecha_tentativa_pago').numFmt = 'dd/mm/yyyy';
  sheet.getColumn('fecha_pago').numFmt = 'dd/mm/yyyy';
  for (const key of ['subtotal', 'iva', 'iva_retenido', 'total']) {
    sheet.getColumn(key).numFmt = '$#,##0.00';
  }

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => { cell.style = headerStyle; });
  headerRow.height = 30;

  const statusColors = {
    'PAGADO': 'FF27AE60',
    'PENDIENTE': 'FFF39C12',
    'ON TRACK': 'FF27AE60',
    'PROXIMO A VENCER': 'FFE67E22',
    'VENCIDO': 'FFE74C3C',
    'REVISIÓN': 'FFC0392B',
    'CANCELADA': 'FF95A5A6',
  };
  const estadoColIdx = columns.findIndex((c) => c.key === 'estado_visual') + 1;

  for (const row of rows) {
    const isCancelled = row.estado === 'CANCELADA';
    const mul = isCancelled ? 0 : 1;

    // CFDI: si no hay serie, se intenta como número (Excel lo alinea a la derecha).
    // Si hay serie alfanumérica, queda como string concatenado.
    const cfdiValue = row.serie
      ? `${row.serie}${row.folio}`
      : (Number.isFinite(Number(row.folio)) ? Number(row.folio) : row.folio);

    const dataRow = sheet.addRow({
      cfdi: cfdiValue,
      uuid: row.uuid,
      fecha_emision: toDate(row.fecha_emision),
      rfc_receptor: row.rfc_receptor,
      alias: row.cliente_alias || '',
      nombre_receptor: row.nombre_receptor,
      concepto: row.concepto,
      proyecto: row.proyecto,
      moneda: row.moneda,
      tipo_cambio: row.tipo_cambio,
      subtotal: (row.subtotal || 0) * mul,
      iva: (row.iva || 0) * mul,
      iva_retenido: (row.iva_retenido || 0) * mul,
      total: (row.total || 0) * mul,
      fecha_tentativa_pago: toDate(row.fecha_tentativa_pago),
      estado_visual: row.estado_visual,
      fecha_pago: toDate(row.fecha_pago),
      comentarios: row.comentarios,
    });

    const color = statusColors[row.estado_visual];
    if (color) {
      dataRow.getCell(estadoColIdx).font = { color: { argb: color }, bold: true };
    }
  }

  // Fila de totales con fórmula SUBTOTAL(9,…) para que respete los filtros de Excel.
  if (rows.length > 0) {
    const dataStart = 2;
    const dataEnd = rows.length + 1;
    const totalsRow = sheet.addRow({ cfdi: 'TOTALES' });
    totalsRow.font = { bold: true };
    for (const key of ['subtotal', 'iva', 'iva_retenido', 'total']) {
      const colIdx = columns.findIndex((c) => c.key === key) + 1;
      const colLetter = sheet.getColumn(colIdx).letter;
      const fallback = rows.reduce(
        (s, r) => s + ((r.estado === 'CANCELADA' ? 0 : r[key]) || 0),
        0
      );
      totalsRow.getCell(colIdx).value = {
        formula: `SUBTOTAL(9,${colLetter}${dataStart}:${colLetter}${dataEnd})`,
        result: fallback,
      };
      totalsRow.getCell(colIdx).numFmt = '$#,##0.00';
    }
  }

  // Auto-filter cubriendo todas las columnas (ahora hay 18 en vez de 17).
  const lastColLetter = sheet.getColumn(columns.length).letter;
  sheet.autoFilter = { from: 'A1', to: `${lastColLetter}${rows.length + 1}` };

  const dateStr = new Date().toISOString().substring(0, 10);
  const filename = `Cobranza_${empresa || 'Consolidado'}_${dateStr}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;
