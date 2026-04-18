const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Error en la solicitud');
  }
  return res.json();
}

function serializeFilters(params) {
  const { estado, ...rest } = params;
  const out = {};
  if (Array.isArray(estado) && estado.length > 0) {
    out.estados = estado.join('|');
  } else if (typeof estado === 'string' && estado && estado !== 'TODOS') {
    // Retrocompat por si alguna llamada pasa el estado como string.
    out.estado = estado;
  }
  for (const [k, v] of Object.entries(rest)) {
    if (v == null || v === '') continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      out[k] = v.join('|');
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function getInvoices(params) {
  const query = new URLSearchParams(serializeFilters(params)).toString();
  return request(`/invoices?${query}`);
}

export function updateInvoice(id, data) {
  return request(`/invoices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteInvoice(id) {
  return request(`/invoices/${id}`, { method: 'DELETE' });
}

export function deleteInvoices(ids) {
  return request('/invoices/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export async function uploadFiles(files, empresa) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  if (empresa) {
    formData.append('empresa', empresa);
  }
  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Error al subir archivos');
  }
  return res.json();
}

export function getDashboard({
  empresa,
  clientes,
  estado,
  moneda,
  search,
  fecha_desde,
  fecha_hasta,
  fecha_tent_desde,
  fecha_tent_hasta,
} = {}) {
  const params = {};
  if (empresa) params.empresa = empresa;
  if (clientes && clientes.length > 0) params.clientes = clientes.join('|');
  if (Array.isArray(estado) && estado.length > 0) {
    params.estados = estado.join('|');
  } else if (typeof estado === 'string' && estado && estado !== 'TODOS') {
    params.estado = estado;
  }
  if (moneda && moneda !== 'Todas') params.moneda = moneda;
  if (search) params.search = search;
  if (fecha_desde) params.fecha_desde = fecha_desde;
  if (fecha_hasta) params.fecha_hasta = fecha_hasta;
  if (fecha_tent_desde) params.fecha_tent_desde = fecha_tent_desde;
  if (fecha_tent_hasta) params.fecha_tent_hasta = fecha_tent_hasta;
  const query = new URLSearchParams(params).toString();
  return request(`/dashboard${query ? '?' + query : ''}`);
}

export function getRezagadas({ empresa } = {}) {
  const params = {};
  if (empresa) params.empresa = empresa;
  const query = new URLSearchParams(params).toString();
  return request(`/dashboard/rezagadas${query ? '?' + query : ''}`);
}

export function getExportUrl(params) {
  const query = new URLSearchParams(serializeFilters(params)).toString();
  return `${BASE}/export?${query}`;
}

export function getRfcs() {
  return request('/settings/rfcs');
}

export function addRfc(rfc, empresa) {
  return request('/settings/rfcs', {
    method: 'POST',
    body: JSON.stringify({ rfc, empresa }),
  });
}

export function deleteRfc(id) {
  return request(`/settings/rfcs/${id}`, { method: 'DELETE' });
}

export function reassignRfcs() {
  return request('/settings/reassign', { method: 'POST' });
}

export function getAliases() {
  return request('/aliases');
}

export function saveAlias(nombre_receptor, alias, rfc_receptor = null) {
  return request('/aliases', {
    method: 'POST',
    body: JSON.stringify({ nombre_receptor, alias, rfc_receptor }),
  });
}

export function deleteAlias(id) {
  return request(`/aliases/${id}`, { method: 'DELETE' });
}
