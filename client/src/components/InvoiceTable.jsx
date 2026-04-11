import { useState } from 'react';
import { ChevronUp, ChevronDown, Pencil, Check, X, Trash2, Tag } from 'lucide-react';
import StatusBadge from './StatusBadge';
import AliasModal from './AliasModal';
import { updateInvoice, deleteInvoice } from '../api';

function formatMoney(n) {
  return (n || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(d) {
  if (!d) return '-';
  const parts = d.substring(0, 10).split('-');
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const COLUMNS = [
  { key: 'folio', label: 'CFDI', sortable: true, width: 'w-20' },
  { key: 'fecha_emision', label: 'Fecha Emisión', sortable: true, width: 'w-28' },
  { key: 'nombre_receptor', label: 'Cliente', sortable: true, width: 'w-48' },
  { key: 'concepto', label: 'Concepto', sortable: false, width: 'w-52' },
  { key: 'proyecto', label: 'Proyecto', sortable: true, width: 'w-32', editable: true },
  { key: 'moneda', label: 'Mon.', sortable: true, width: 'w-14' },
  { key: 'subtotal', label: 'Subtotal', sortable: true, width: 'w-28', money: true },
  { key: 'iva', label: 'IVA', sortable: true, width: 'w-24', money: true },
  { key: 'total', label: 'Total', sortable: true, width: 'w-28', money: true },
  { key: 'fecha_tentativa_pago', label: 'Fecha Tent.', sortable: true, width: 'w-28', editable: true, type: 'date' },
  { key: 'estado_visual', label: 'Estado', sortable: false, width: 'w-36' },
  { key: 'comentarios', label: 'Comentarios', sortable: false, width: 'w-40', editable: true },
];

export default function InvoiceTable({
  invoices,
  sort,
  order,
  onSort,
  onRefresh,
  pagination,
  onPageChange,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [aliasInvoice, setAliasInvoice] = useState(null);

  const startEdit = (inv) => {
    setEditingId(inv.id);
    setEditData({
      proyecto: inv.proyecto || '',
      fecha_tentativa_pago: inv.fecha_tentativa_pago || '',
      comentarios: inv.comentarios || '',
      estado: inv.estado,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    try {
      await updateInvoice(editingId, editData);
      setEditingId(null);
      onRefresh?.();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta factura?')) return;
    try {
      await deleteInvoice(id);
      onRefresh?.();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const handleStatusChange = async (inv, newEstado) => {
    try {
      const data = { estado: newEstado };
      if (newEstado === 'PAGADO') {
        data.fecha_pago = new Date().toISOString().substring(0, 10);
      }
      await updateInvoice(inv.id, data);
      onRefresh?.();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider ${col.width} ${
                    col.sortable ? 'cursor-pointer select-none hover:bg-slate-700' : ''
                  }`}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sort === col.key && (
                      order === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider w-20">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((inv) => {
              const isEditing = editingId === inv.id;
              return (
                <tr
                  key={inv.id}
                  id={`invoice-${inv.id}`}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="px-3 py-2.5 whitespace-nowrap">
                      {isEditing && col.editable ? (
                        col.type === 'date' ? (
                          <input
                            type="date"
                            value={editData[col.key] || ''}
                            onChange={(e) =>
                              setEditData({ ...editData, [col.key]: e.target.value })
                            }
                            className="border rounded px-1 py-0.5 text-sm w-full"
                          />
                        ) : (
                          <input
                            type="text"
                            value={editData[col.key] || ''}
                            onChange={(e) =>
                              setEditData({ ...editData, [col.key]: e.target.value })
                            }
                            className="border rounded px-1 py-0.5 text-sm w-full"
                          />
                        )
                      ) : col.key === 'folio' ? (
                        <span className="font-mono text-xs">
                          {inv.serie ? `${inv.serie}${inv.folio}` : inv.folio}
                        </span>
                      ) : col.key === 'fecha_emision' || col.key === 'fecha_tentativa_pago' ? (
                        formatDate(inv[col.key])
                      ) : col.key === 'estado_visual' ? (
                        isEditing ? (
                          <select
                            value={editData.estado}
                            onChange={(e) =>
                              setEditData({ ...editData, estado: e.target.value })
                            }
                            className="border rounded px-1 py-0.5 text-sm"
                          >
                            <option value="PENDIENTE">PENDIENTE</option>
                            <option value="PAGADO">PAGADO</option>
                            <option value="CANCELADA">CANCELADA</option>
                          </select>
                        ) : (
                          <StatusBadge status={inv.estado_visual} />
                        )
                      ) : col.money ? (
                        <span className="font-mono text-right block">
                          ${formatMoney(inv[col.key])}
                        </span>
                      ) : col.key === 'nombre_receptor' ? (
                        <div className="flex items-center gap-1 max-w-xs">
                          <span className="truncate" title={`${inv.nombre_display}${inv.cliente_alias ? ` (XML: ${inv.nombre_receptor})` : ''}`}>
                            {inv.nombre_display || inv.nombre_receptor}
                          </span>
                          <button
                            onClick={() => setAliasInvoice(inv)}
                            className="shrink-0 p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Asignar alias"
                          >
                            <Tag size={12} />
                          </button>
                        </div>
                      ) : col.key === 'concepto' ? (
                        <span className="block max-w-xs truncate" title={inv.concepto}>
                          {inv.concepto}
                        </span>
                      ) : (
                        inv[col.key] || '-'
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Guardar"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                            title="Cancelar"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(inv)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          {inv.estado !== 'PAGADO' && inv.estado !== 'CANCELADA' && (
                            <button
                              onClick={() => handleStatusChange(inv, 'PAGADO')}
                              className="p-1 text-green-600 hover:bg-green-50 rounded text-xs font-medium"
                              title="Marcar como pagado"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length + 1}
                  className="px-6 py-12 text-center text-gray-400"
                >
                  No se encontraron facturas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {aliasInvoice && (
        <AliasModal
          invoice={aliasInvoice}
          onClose={() => setAliasInvoice(null)}
          onSaved={onRefresh}
        />
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Mostrando {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100"
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
              const start = Math.max(1, pagination.page - 2);
              const p = start + i;
              if (p > pagination.pages) return null;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  className={`px-3 py-1 border rounded text-sm ${
                    p === pagination.page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
