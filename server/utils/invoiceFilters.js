// Helper compartido para construir filtros SQL de facturas.
// Usado por server/routes/invoices.js y server/routes/dashboard.js.
//
// `estadoSqlExpr` replica en SQL la función computeEstadoVisual del backend.
// Se expone como string para poder inyectarlo dentro de un CTE/SELECT.

const estadoSqlExpr = `
  CASE
    WHEN i.estado = 'CANCELADA' THEN 'CANCELADA'
    WHEN i.estado = 'PAGADO' THEN 'PAGADO'
    WHEN i.fecha_tentativa_pago IS NULL AND
         CAST(julianday(date('now')) - julianday(date(i.fecha_emision)) AS INTEGER) >= 7
         THEN 'REVISIÓN'
    WHEN i.fecha_tentativa_pago IS NULL THEN 'PENDIENTE'
    WHEN date(i.fecha_tentativa_pago) < date('now') THEN 'VENCIDO'
    WHEN CAST(julianday(date(i.fecha_tentativa_pago)) - julianday(date('now')) AS INTEGER) <= 7 THEN 'PROXIMO A VENCER'
    ELSE 'ON TRACK'
  END`;

// Construye las condiciones WHERE y params según los filtros recibidos.
// NO incluye `estado` (que es post-CTE porque estado_visual es computado).
// Incluye tanto `cliente` (single, legado) como `clientes` (pipe-separated, multi).
function buildBaseFilters(q = {}) {
  const conditions = [];
  const params = {};

  if (q.empresa) {
    conditions.push('i.empresa = @empresa');
    params.empresa = q.empresa;
  }

  if (q.moneda && q.moneda !== 'Todas') {
    conditions.push('i.moneda = @moneda');
    params.moneda = q.moneda;
  }

  if (q.fecha_desde) {
    conditions.push('i.fecha_emision >= @fecha_desde');
    params.fecha_desde = q.fecha_desde;
  }

  if (q.fecha_hasta) {
    conditions.push('i.fecha_emision <= @fecha_hasta');
    params.fecha_hasta = q.fecha_hasta;
  }

  if (q.fecha_tent_desde) {
    conditions.push('i.fecha_tentativa_pago >= @fecha_tent_desde');
    params.fecha_tent_desde = q.fecha_tent_desde;
  }

  if (q.fecha_tent_hasta) {
    conditions.push('i.fecha_tentativa_pago <= @fecha_tent_hasta');
    params.fecha_tent_hasta = q.fecha_tent_hasta;
  }

  if (q.cliente) {
    conditions.push(
      '(i.nombre_receptor = @cliente OR i.nombre_receptor IN (SELECT nombre_receptor FROM client_aliases WHERE alias = @cliente))'
    );
    params.cliente = q.cliente;
  }

  // Multi-cliente (pipe-separated), usado por el dashboard.
  // Cada item matchea nombre_receptor exacto o alias.
  if (q.clientes) {
    const list = Array.isArray(q.clientes)
      ? q.clientes
      : String(q.clientes).split('|').filter(Boolean);
    if (list.length > 0) {
      const placeholders = list.map((_, i) => `@cliente_multi_${i}`).join(', ');
      conditions.push(
        `(i.nombre_receptor IN (${placeholders}) OR i.nombre_receptor IN (SELECT nombre_receptor FROM client_aliases WHERE alias IN (${placeholders})))`
      );
      list.forEach((val, i) => {
        params[`cliente_multi_${i}`] = val;
      });
    }
  }

  if (q.search) {
    conditions.push(`(
      i.uuid LIKE @search OR
      i.nombre_receptor LIKE @search OR
      i.rfc_receptor LIKE @search OR
      i.concepto LIKE @search OR
      i.proyecto LIKE @search OR
      i.folio LIKE @search OR
      i.comentarios LIKE @search OR
      i.serie LIKE @search OR
      i.nombre_receptor IN (SELECT nombre_receptor FROM client_aliases WHERE alias LIKE @search)
    )`);
    params.search = `%${q.search}%`;
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  return { conditions, params, where };
}

// Construye el filtro de `estado_visual` que se aplica DESPUÉS del CTE.
// Acepta array o string pipe-separated. 'TODOS' como sentinel se ignora.
// Retorna { where, params } listos para concatenar en el SQL post-CTE.
function buildEstadoFilter(estados) {
  const list = Array.isArray(estados)
    ? estados
    : estados
      ? String(estados).split('|').filter(Boolean)
      : [];
  const filtered = list.filter((e) => e && e !== 'TODOS');
  if (filtered.length === 0) return { where: '', params: {} };
  const placeholders = filtered.map((_, i) => `@estado_${i}`).join(', ');
  const params = {};
  filtered.forEach((e, i) => {
    params[`estado_${i}`] = e;
  });
  return { where: `WHERE estado_visual IN (${placeholders})`, params };
}

module.exports = { buildBaseFilters, buildEstadoFilter, estadoSqlExpr };
