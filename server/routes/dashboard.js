const express = require('express');
const db = require('../db');
const { computeEstadoVisual } = require('./invoices');

const router = express.Router();

// GET /api/dashboard?empresa=DLG&clientes=RFC1|RFC2 (clientes = pipe-separated nombre_receptor)
router.get('/', (req, res) => {
  const { empresa, clientes: clientesParam } = req.query;
  const whereEmpresa = empresa ? 'WHERE i.empresa = ?' : '';
  const empresaParams = empresa ? [empresa] : [];
  const clientesFiltro = clientesParam ? clientesParam.split('|').filter(Boolean) : null;

  const today = new Date().toISOString().substring(0, 10);

  // All invoices with alias join (needed for clientesList and KPIs)
  const allInvoices = db
    .prepare(`
      SELECT i.*, COALESCE(a.alias, i.nombre_receptor) AS nombre_display
      FROM invoices i
      LEFT JOIN client_aliases a ON i.rfc_receptor = a.rfc_receptor
      ${whereEmpresa}
    `)
    .all(...empresaParams);

  // Build client list (full, unfiltered — for the selector)
  const clientesMap = new Map();
  for (const inv of allInvoices) {
    if (!clientesMap.has(inv.nombre_receptor)) {
      clientesMap.set(inv.nombre_receptor, inv.nombre_display || inv.nombre_receptor);
    }
  }
  const clientesList = [...clientesMap.entries()]
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));

  // Apply cliente filter (if any) before computing KPIs
  const baseInvoices = clientesFiltro && clientesFiltro.length > 0
    ? allInvoices.filter((inv) => clientesFiltro.includes(inv.nombre_receptor))
    : allInvoices;

  const enriched = baseInvoices.map((row) => ({
    ...row,
    estado_visual: computeEstadoVisual(row, today),
  }));

  // KPI: Total facturado MXN (convirtiendo USD)
  const totalFacturadoMXN = enriched.reduce((sum, inv) => {
    if (inv.estado === 'CANCELADA') return sum;
    if (inv.moneda === 'USD') {
      return sum + inv.total * (inv.tipo_cambio || 1);
    }
    return sum + inv.total;
  }, 0);

  // KPI: Total cobrado
  const totalCobrado = enriched
    .filter((i) => i.estado === 'PAGADO')
    .reduce((sum, inv) => {
      if (inv.moneda === 'USD') {
        return sum + inv.total * (inv.tipo_cambio || 1);
      }
      return sum + inv.total;
    }, 0);

  // KPI: Total pendiente
  const totalPendiente = enriched
    .filter((i) => !['PAGADO', 'CANCELADA'].includes(i.estado))
    .reduce((sum, inv) => {
      if (inv.moneda === 'USD') {
        return sum + inv.total * (inv.tipo_cambio || 1);
      }
      return sum + inv.total;
    }, 0);

  // Counts by visual status
  const statusCounts = {};
  for (const inv of enriched) {
    statusCounts[inv.estado_visual] = (statusCounts[inv.estado_visual] || 0) + 1;
  }

  // Facturacion mensual (last 12 months)
  const monthlyData = {};
  for (const inv of enriched) {
    if (inv.estado === 'CANCELADA') continue;
    const month = inv.fecha_emision.substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) monthlyData[month] = 0;
    if (inv.moneda === 'USD') {
      monthlyData[month] += inv.total * (inv.tipo_cambio || 1);
    } else {
      monthlyData[month] += inv.total;
    }
  }

  const monthlyChart = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, monto]) => ({ mes, monto: Math.round(monto * 100) / 100 }));

  // Top 10 clientes por monto pendiente
  const clientePendiente = {};
  for (const inv of enriched) {
    if (['PAGADO', 'CANCELADA'].includes(inv.estado)) continue;
    const name = inv.nombre_receptor;
    if (!clientePendiente[name]) clientePendiente[name] = 0;
    if (inv.moneda === 'USD') {
      clientePendiente[name] += inv.total * (inv.tipo_cambio || 1);
    } else {
      clientePendiente[name] += inv.total;
    }
  }

  const topClientes = Object.entries(clientePendiente)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([cliente, monto]) => ({
      cliente,
      monto: Math.round(monto * 100) / 100,
    }));

  // Proximas a vencer
  const proximasVencer = enriched
    .filter((i) => i.estado_visual === 'PROXIMO A VENCER')
    .sort((a, b) => (a.fecha_tentativa_pago || '').localeCompare(b.fecha_tentativa_pago || ''));

  // Sin fecha de pago
  const sinFecha = enriched
    .filter((i) => i.estado_visual === 'SIN FECHA' || (i.estado_visual === 'PENDIENTE' && !i.fecha_tentativa_pago))
    .sort((a, b) => a.fecha_emision.localeCompare(b.fecha_emision));

  // Vencidas
  const vencidas = enriched
    .filter((i) => i.estado_visual === 'VENCIDO')
    .sort((a, b) => (a.fecha_tentativa_pago || '').localeCompare(b.fecha_tentativa_pago || ''));

  res.json({
    kpis: {
      totalFacturadoMXN: Math.round(totalFacturadoMXN * 100) / 100,
      totalCobrado: Math.round(totalCobrado * 100) / 100,
      totalPendiente: Math.round(totalPendiente * 100) / 100,
      sinFechaCount: statusCounts['SIN FECHA'] || 0,
      vencidasCount: statusCounts['VENCIDO'] || 0,
      proximasCount: statusCounts['PROXIMO A VENCER'] || 0,
      totalFacturas: enriched.length,
    },
    statusCounts,
    monthlyChart,
    topClientes,
    proximasVencer,
    proximasVencerTotal: proximasVencer.length,
    sinFecha,
    sinFechaTotal: sinFecha.length,
    vencidas: vencidas.slice(0, 20),
    clientesList,
  });
});

module.exports = router;
