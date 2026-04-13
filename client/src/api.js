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

export function getInvoices(params) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString();
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

export function getDashboard({ empresa, clientes } = {}) {
  const params = {};
  if (empresa) params.empresa = empresa;
  if (clientes && clientes.length > 0) params.clientes = clientes.join('|');
  const query = new URLSearchParams(params).toString();
  return request(`/dashboard${query ? '?' + query : ''}`);
}

export function getExportUrl(params) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString();
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

export function saveAlias(rfc_receptor, alias, nombre_original) {
  return request('/aliases', {
    method: 'POST',
    body: JSON.stringify({ rfc_receptor, alias, nombre_original }),
  });
}

export function deleteAlias(id) {
  return request(`/aliases/${id}`, { method: 'DELETE' });
}
