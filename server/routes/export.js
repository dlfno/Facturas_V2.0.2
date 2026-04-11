const express = require('express');
const ExcelJS = require('exceljs');
const db = require('../db');
const { computeEstadoVisual } = require('./invoices');

const router = express.Router();

// GET /api/export?empresa=DLG&...same filters as invoices...
router.get('/', async (req, res) => {
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
  } = req.query;

  const conditions = [];
  const params = {};

  if (empresa) {
    conditions.push('empresa = @empresa');
    params.empresa = empresa;
  }
  if (moneda && moneda !== 'Todas') {
    conditions.push('moneda = @moneda');
    params.moneda = moneda;
  }
  if (fecha_desde) {
    conditions.push('fecha_emision >= @fecha_desde');
    params.fecha_desde = fecha_desde;
  }
  if (fecha_hasta) {
    conditions.push('fecha_emision <= @fecha_hasta');
    params.fecha_hasta = fecha_hasta;
  }
  if (fecha_tent_desde) {
    conditions.push('fecha_tentativa_pago >= @fecha_tent_desde');
    params.fecha_tent_desde = fecha_tent_desde;
  }
  if (fecha_tent_hasta) {
    conditions.push('fecha_tentativa_pago <= @fecha_tent_hasta');
    params.fecha_tent_hasta = fecha_tent_hasta;
  }
  if (cliente) {
    conditions.push('nombre_receptor = @cliente');
    params.cliente = cliente;
  }
  if (search) {
    conditions.push(`(
      nombre_receptor LIKE @search OR
      rfc_receptor LIKE @search OR
      concepto LIKE @search OR
      proyecto LIKE @search OR
      folio LIKE @search OR
      comentarios LIKE @search
    )`);
    params.search = `%${search}%`;
  }
  if (estado && !['TODOS', 'PENDIENTE', 'ON TRACK', 'PROXIMO A VENCER', 'VENCIDO', 'SIN FECHA'].includes(estado)) {
    if (['PAGADO', 'CANCELADA'].includes(estado)) {
      conditions.push('estado = @estado');
      params.estado = estado;
    }
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  let rows = db.prepare(`SELECT * FROM invoices ${whereClause} ORDER BY fecha_emision DESC`).all(params);

  const today = new Date().toISOString().substring(0, 10);
  rows = rows.map((r) => ({ ...r, estado_visual: computeEstadoVisual(r, today) }));

  // Post-filter by computed status
  if (estado && ['PENDIENTE', 'ON TRACK', 'PROXIMO A VENCER', 'VENCIDO', 'SIN FECHA'].includes(estado)) {
    rows = rows.filter((r) => r.estado_visual === estado);
  }

  // Build Excel
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(empresa || 'Cobranza');

  // Header style
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
    { header: 'CFDI', key: 'cfdi', width: 12 },
    { header: 'Fecha Emisión', key: 'fecha_emision', width: 14 },
    { header: 'RFC', key: 'rfc_receptor', width: 16 },
    { header: 'Cliente', key: 'nombre_receptor', width: 30 },
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

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.style = headerStyle;
  });
  headerRow.height = 30;

  // Add data rows
  for (const row of rows) {
    const dataRow = sheet.addRow({
      cfdi: row.serie ? `${row.serie}${row.folio}` : row.folio,
      fecha_emision: row.fecha_emision,
      rfc_receptor: row.rfc_receptor,
      nombre_receptor: row.nombre_receptor,
      concepto: row.concepto,
      proyecto: row.proyecto,
      moneda: row.moneda,
      tipo_cambio: row.tipo_cambio,
      subtotal: row.subtotal,
      iva: row.iva,
      iva_retenido: row.iva_retenido,
      total: row.total,
      fecha_tentativa_pago: row.fecha_tentativa_pago,
      estado_visual: row.estado_visual,
      fecha_pago: row.fecha_pago,
      comentarios: row.comentarios,
    });

    // Currency format
    ['subtotal', 'iva', 'iva_retenido', 'total'].forEach((key) => {
      const col = columns.findIndex((c) => c.key === key) + 1;
      if (col > 0) {
        dataRow.getCell(col).numFmt = '$#,##0.00';
      }
    });

    // Status color
    const estadoCol = columns.findIndex((c) => c.key === 'estado_visual') + 1;
    const statusColors = {
      'PAGADO': 'FF27AE60',
      'PENDIENTE': 'FFF39C12',
      'ON TRACK': 'FF27AE60',
      'PROXIMO A VENCER': 'FFE67E22',
      'VENCIDO': 'FFE74C3C',
      'SIN FECHA': 'FFC0392B',
      'CANCELADA': 'FF95A5A6',
    };
    const color = statusColors[row.estado_visual];
    if (color) {
      dataRow.getCell(estadoCol).font = { color: { argb: color }, bold: true };
    }
  }

  // Totals row
  if (rows.length > 0) {
    const totalsRow = sheet.addRow({
      cfdi: 'TOTALES',
      subtotal: rows.reduce((s, r) => s + (r.subtotal || 0), 0),
      iva: rows.reduce((s, r) => s + (r.iva || 0), 0),
      iva_retenido: rows.reduce((s, r) => s + (r.iva_retenido || 0), 0),
      total: rows.reduce((s, r) => s + (r.total || 0), 0),
    });
    totalsRow.font = { bold: true };
    ['subtotal', 'iva', 'iva_retenido', 'total'].forEach((key) => {
      const col = columns.findIndex((c) => c.key === key) + 1;
      if (col > 0) {
        totalsRow.getCell(col).numFmt = '$#,##0.00';
      }
    });
  }

  // Auto-filter
  sheet.autoFilter = { from: 'A1', to: `P${rows.length + 1}` };

  const dateStr = new Date().toISOString().substring(0, 10);
  const filename = `Cobranza_${empresa || 'Consolidado'}_${dateStr}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;
