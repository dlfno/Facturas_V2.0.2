import { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronRight, Trash2, Tag, Undo2, Check, X, Pin, PinOff } from 'lucide-react';
import StatusBadge from './StatusBadge';
import AliasModal from './AliasModal';
import ClientNameCell from './ClientNameCell';
import ConfirmModal from './ConfirmModal';
import { updateInvoice, deleteInvoice, deleteInvoices } from '../api';

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
  { key: 'folio', label: 'CFDI', sortable: true, width: 'w-28', stickyWidth: 7 },
  { key: 'uuid', label: 'Folio Fiscal', sortable: false, width: 'w-72' },
  { key: 'fecha_emision', label: 'Fecha Emisión', sortable: true, width: 'w-28', stickyWidth: 7, pinnable: true },
  { key: 'nombre_receptor', label: 'Cliente', sortable: true, width: 'w-48', stickyWidth: 12, pinnable: true },
  { key: 'concepto', label: 'Concepto', sortable: false, width: 'w-52' },
  { key: 'proyecto', label: 'Proyecto', sortable: true, width: 'w-32', clickEdit: 'text' },
  { key: 'moneda', label: 'Mon.', sortable: true, width: 'w-14' },
  { key: 'tipo_cambio', label: 'T.C.', sortable: true, width: 'w-16' },
  { key: 'subtotal', label: 'Subtotal', sortable: true, width: 'w-28', money: true },
  { key: 'iva', label: 'IVA', sortable: true, width: 'w-24', money: true },
  { key: 'total', label: 'Total', sortable: true, width: 'w-28', money: true },
  { key: 'fecha_tentativa_pago', label: 'Fecha Tent.', sortable: true, width: 'w-28', clickEdit: 'date' },
  { key: 'estado_visual', label: 'Estado', sortable: false, width: 'w-36', clickEdit: 'estado' },
  { key: 'fecha_pago', label: 'Fecha Pago', sortable: true, width: 'w-28' },
  { key: 'comentarios', label: 'Comentarios', sortable: false, width: 'w-40', clickEdit: 'text' },
];

function InlineEdit({ value, type, onSave, onCancel }) {
  const [val, setVal] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
    if (type === 'text') ref.current?.select();
  }, []);

  const save = () => {
    if (val !== (value || '')) onSave(val);
    else onCancel();
  };

  if (type === 'date') {
    return (
      <input
        ref={ref}
        type="date"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onCancel(); }}
        className="border border-blue-400 rounded px-1 py-0.5 text-sm w-full bg-blue-50 focus:outline-none"
      />
    );
  }

  return (
    <textarea
      ref={ref}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); } if (e.key === 'Escape') onCancel(); }}
      placeholder="Ctrl+Enter para guardar, Esc para cancelar"
      className="border border-blue-400 rounded px-1 py-0.5 text-sm w-full bg-blue-50 focus:outline-none min-w-[200px] resize-y"
      rows={3}
    />
  );
}

function InlineEstado({ value, onSave, onCancel }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <select
      ref={ref}
      value={value}
      onChange={(e) => onSave(e.target.value)}
      onBlur={onCancel}
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
      className="border border-blue-400 rounded px-1 py-0.5 text-sm bg-blue-50 focus:outline-none"
    >
      <option value="PENDIENTE">PENDIENTE</option>
      <option value="PAGADO">PAGADO</option>
      <option value="CANCELADA">CANCELADA</option>
    </select>
  );
}

export default function InvoiceTable({
  invoices,
  sort,
  order,
  onSort,
  onRefresh,
  pagination,
  onPageChange,
  onLimitChange,
}) {
  const [aliasInvoice, setAliasInvoice] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [confirmAction, setConfirmAction] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [pagoModal, setPagoModal] = useState(null);
  const [pagoFecha, setPagoFecha] = useState('');
  // Per-cell editing: { invoiceId, key }
  const [editingCell, setEditingCell] = useState(null);
  // Expanded text cells
  const [expandedCells, setExpandedCells] = useState(new Set());
  // Pinned columns
  const [pinnedCols, setPinnedCols] = useState({ fecha_emision: false, nombre_receptor: false });
  const tableRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const prevPinnedColsRef = useRef({ fecha_emision: false, nombre_receptor: false });
  const [stickyLefts, setStickyLefts] = useState({});

  const allSelected = invoices.length > 0 && selected.size === invoices.length;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(invoices.map((i) => i.id)));
  };

  const toggleOne = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const saveCell = async (invId, key, value) => {
    setEditingCell(null);
    try {
      await updateInvoice(invId, { [key]: value });
      onRefresh?.();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };

  const handleEstadoChange = (inv, newEstado) => {
    setEditingCell(null);
    if (newEstado === inv.estado) return;
    if (newEstado === 'PAGADO') {
      requestPagado(inv);
    } else {
      saveCell(inv.id, 'estado', newEstado);
    }
  };

  const requestDeleteOne = (id) => {
    setConfirmAction({
      title: 'Eliminar factura',
      message: '¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.',
      action: async () => {
        await deleteInvoice(id);
        selected.delete(id);
        setSelected(new Set(selected));
        onRefresh?.();
      },
    });
  };

  const requestDeleteSelected = () => {
    setConfirmAction({
      title: `Eliminar ${selected.size} factura(s)`,
      message: `¿Estás seguro de que deseas eliminar ${selected.size} factura(s) seleccionada(s)? Esta acción no se puede deshacer.`,
      action: async () => {
        await deleteInvoices([...selected]);
        setSelected(new Set());
        onRefresh?.();
      },
    });
  };

  const executeConfirm = async () => {
    if (confirmAction?.action) {
      try { await confirmAction.action(); } catch (err) { alert('Error: ' + err.message); }
    }
    setConfirmAction(null);
  };

  const requestPagado = (inv) => {
    setPagoModal(inv);
    setPagoFecha(new Date().toISOString().substring(0, 10));
  };

  const savePagado = async () => {
    if (!pagoModal || !pagoFecha) return;
    try {
      await updateInvoice(pagoModal.id, { estado: 'PAGADO', fecha_pago: pagoFecha });
      setPagoModal(null);
      setPagoFecha('');
      onRefresh?.();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const revertPagado = (inv) => {
    setConfirmAction({
      title: 'Quitar pago',
      message: `¿Regresar la factura ${inv.serie || ''}${inv.folio} a estado pendiente? Se eliminará la fecha de pago.`,
      action: async () => {
        await updateInvoice(inv.id, { estado: 'PENDIENTE', fecha_pago: '' });
        onRefresh?.();
      },
    });
  };

  const isEditing = (invId, key) =>
    editingCell && editingCell.invoiceId === invId && editingCell.key === key;

  const toggleExpand = (invId, key) => {
    const cellKey = `${invId}-${key}`;
    const next = new Set(expandedCells);
    if (next.has(cellKey)) next.delete(cellKey);
    else next.add(cellKey);
    setExpandedCells(next);
  };

  const isCellExpanded = (invId, key) => expandedCells.has(`${invId}-${key}`);

  const togglePin = (key) => {
    const newPinnedCols = { ...pinnedCols, [key]: !pinnedCols[key] };

    // Measure the current DOM (old layout) to pre-compute pixel-accurate left offsets
    // for the new pinned configuration — avoids any stale-state flash on the first render.
    const newLefts = {};
    if (tableRef.current && Object.values(newPinnedCols).some(Boolean)) {
      const folioTh = tableRef.current.querySelector('th[data-col="folio"]');
      let left = folioTh ? folioTh.offsetWidth : 112; // folio width in px
      // Iterate COLUMNS in original order so pinned cols accumulate left correctly
      for (const col of COLUMNS) {
        if (!col.pinnable || !newPinnedCols[col.key]) continue;
        newLefts[col.key] = left;
        const th = tableRef.current.querySelector(`th[data-col="${col.key}"]`);
        left += th ? th.offsetWidth : (col.stickyWidth || 0) * 16;
      }
    }

    setPinnedCols(newPinnedCols);
    setStickyLefts(newLefts);
  };

  const orderedColumns = (() => {
    const folio = COLUMNS[0];
    const pinned = COLUMNS.filter((c) => c.pinnable && pinnedCols[c.key]);
    const rest = COLUMNS.slice(1).filter((c) => !c.pinnable || !pinnedCols[c.key]);
    return [folio, ...pinned, ...rest];
  })();


  // Scroll back to start when a column is unpinned so it doesn't "disappear" behind the scroll position
  useEffect(() => {
    const justUnpinned = Object.keys(pinnedCols).some(
      (key) => prevPinnedColsRef.current[key] && !pinnedCols[key]
    );
    if (justUnpinned && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
    prevPinnedColsRef.current = { ...pinnedCols };
  }, [pinnedCols]);

  const renderCell = (inv, col) => {
    // Click-to-edit cells
    if (col.clickEdit && isEditing(inv.id, col.key)) {
      if (col.clickEdit === 'estado') {
        return (
          <InlineEstado
            value={inv.estado}
            onSave={(v) => handleEstadoChange(inv, v)}
            onCancel={() => setEditingCell(null)}
          />
        );
      }
      return (
        <InlineEdit
          value={col.key === 'fecha_tentativa_pago' ? inv.fecha_tentativa_pago : inv[col.key]}
          type={col.clickEdit}
          onSave={(v) => saveCell(inv.id, col.key, v)}
          onCancel={() => setEditingCell(null)}
        />
      );
    }

    // Clickable display for editable cells
    if (col.clickEdit) {
      if (col.key === 'estado_visual') {
        return (
          <button
            onClick={() => setEditingCell({ invoiceId: inv.id, key: col.key })}
            className="cursor-pointer"
            title="Clic para cambiar estado"
          >
            <StatusBadge status={inv.estado_visual} />
          </button>
        );
      }
      if (col.key === 'fecha_tentativa_pago') {
        return (
          <button
            onClick={() => setEditingCell({ invoiceId: inv.id, key: col.key })}
            className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 text-left w-full"
            title="Clic para editar"
          >
            {inv.fecha_tentativa_pago ? formatDate(inv.fecha_tentativa_pago) : <span className="text-gray-300 italic text-xs">Sin fecha</span>}
          </button>
        );
      }
      // text fields: proyecto, comentarios
      const expanded = isCellExpanded(inv.id, col.key);
      return (
        <div className="flex items-start gap-1">
          {inv[col.key] && (
            <button
              onClick={() => toggleExpand(inv.id, col.key)}
              className="shrink-0 p-0.5 text-gray-400 hover:text-blue-600 rounded"
              title={expanded ? 'Colapsar' : 'Expandir'}
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          )}
          <button
            onClick={() => setEditingCell({ invoiceId: inv.id, key: col.key })}
            className={`cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 text-left w-full block ${expanded ? 'whitespace-normal break-words' : 'truncate max-w-[200px]'}`}
            title={inv[col.key] || 'Clic para editar'}
          >
            {inv[col.key] || <span className="text-gray-300 italic text-xs">Vacío</span>}
          </button>
        </div>
      );
    }

    // Non-editable cells
    if (col.key === 'folio') {
      return (
        <span className="font-mono text-xs">
          {inv.serie ? `${inv.serie}${inv.folio}` : inv.folio}
        </span>
      );
    }
    if (col.key === 'uuid') {
      return (
        <button
          onClick={() => {
            navigator.clipboard.writeText(inv.uuid);
            setCopiedId(inv.id);
            setTimeout(() => setCopiedId(null), 1500);
          }}
          className="font-mono text-xs text-gray-500 hover:text-blue-600 cursor-pointer text-left"
          title="Clic para copiar"
        >
          {copiedId === inv.id ? (
            <span className="text-green-600 font-semibold">Copiado</span>
          ) : inv.uuid}
        </button>
      );
    }
    if (col.key === 'fecha_emision') return formatDate(inv.fecha_emision);
    if (col.key === 'tipo_cambio') {
      return (
        <span className="font-mono text-xs text-right block">
          {inv.tipo_cambio ? inv.tipo_cambio.toFixed(4) : '-'}
        </span>
      );
    }
    if (col.money) {
      return (
        <span className="font-mono text-right block">
          ${formatMoney(inv[col.key])}
        </span>
      );
    }
    if (col.key === 'nombre_receptor') {
      return (
        <ClientNameCell invoice={inv}>
          <button
            onClick={() => setAliasInvoice(inv)}
            className={`shrink-0 p-0.5 rounded transition-colors ${
              inv.cliente_alias
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title={inv.cliente_alias ? `Alias: ${inv.cliente_alias}` : 'Asignar alias'}
          >
            <Tag size={12} />
          </button>
        </ClientNameCell>
      );
    }
    if (col.key === 'fecha_pago') {
      if (inv.fecha_pago) return <span className="text-green-700 font-medium">{formatDate(inv.fecha_pago)}</span>;
      if (inv.estado === 'PAGADO') return <button onClick={() => requestPagado(inv)} className="text-xs text-blue-600 hover:underline">Asignar</button>;
      return <span className="text-gray-300">-</span>;
    }
    if (col.key === 'concepto') {
      return <span className="block max-w-xs truncate" title={inv.concepto}>{inv.concepto}</span>;
    }
    return inv[col.key] || '-';
  };

  const paginationBar = pagination && pagination.total > 0 ? (
    <div className="flex items-center justify-between px-4 py-3 border-gray-200 bg-gray-50">
      <div className="flex items-center gap-4 flex-wrap">
        <p className="text-sm text-gray-600">
          Mostrando {(pagination.page - 1) * pagination.limit + 1}-
          {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
          {pagination.total}
        </p>
        {onLimitChange && (
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">Por página:</label>
            <select
              value={pagination.limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="border rounded px-1.5 py-0.5 text-sm bg-white"
            >
              {[25, 50, 100, 200].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      {pagination.pages > 1 && (
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
                  p === pagination.page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'
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
      )}
    </div>
  ) : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {selected.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border-b border-blue-200">
          <span className="text-sm text-blue-800 font-medium">
            {selected.size} factura(s) seleccionada(s)
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected(new Set())} className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1">
              Deseleccionar
            </button>
            <button
              onClick={requestDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
            >
              <Trash2 size={14} />
              Eliminar seleccionadas
            </button>
          </div>
        </div>
      )}

      {paginationBar && <div className="border-b border-gray-200">{paginationBar}</div>}

      <div ref={scrollContainerRef} className="overflow-x-auto">
        <table ref={tableRef} className="w-full text-sm">
          <thead className="sticky top-0 z-30">
            <tr className="bg-slate-800 text-white">
              {orderedColumns.map((col) => {
                const isPinned = col.pinnable && pinnedCols[col.key];
                const isStickyCol = col.key === 'folio' || isPinned;
                const stickyStyle = isStickyCol && col.key !== 'folio'
                  ? { left: (stickyLefts[col.key] ?? 0) + 'px' }
                  : undefined;
                return (
                  <th
                    key={col.key}
                    data-col={col.key}
                    style={stickyStyle}
                    className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider ${col.width} ${
                      col.sortable ? 'cursor-pointer select-none hover:bg-slate-700' : ''
                    }${
                      isStickyCol
                        ? col.key === 'folio'
                          ? ' sticky left-0 z-20 bg-slate-800 border-r border-slate-600'
                          : ' sticky z-20 bg-slate-800 border-r border-slate-600'
                        : ''
                    }`}
                    onClick={() => col.sortable && onSort?.(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.key === 'folio' && (
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 cursor-pointer"
                        />
                      )}
                      {col.label}
                      {col.sortable && sort === col.key && (
                        order === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                      {col.pinnable && (
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePin(col.key); }}
                          className={`ml-auto p-0.5 rounded hover:bg-slate-600 ${
                            pinnedCols[col.key] ? 'text-blue-300' : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title={pinnedCols[col.key] ? 'Desfijar columna' : 'Fijar columna junto a CFDI'}
                        >
                          {pinnedCols[col.key] ? <PinOff size={11} /> : <Pin size={11} />}
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider w-20">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((inv, idx) => {
              const isSelected = selected.has(inv.id);
              const isOdd = idx % 2 === 1;
              const rowBg = isSelected ? 'bg-blue-50/50' : isOdd ? 'bg-gray-100/70' : '';
              const stickyBg = isSelected ? 'bg-blue-50' : isOdd ? 'bg-gray-100' : 'bg-white';
              return (
                <tr
                  key={inv.id}
                  id={`invoice-${inv.id}`}
                  className={`group hover:bg-gray-200/60 ${rowBg}`}
                >
                  {orderedColumns.map((col) => {
                    const textCellOpen = col.clickEdit === 'text' && (isCellExpanded(inv.id, col.key) || isEditing(inv.id, col.key));
                    const isPinned = col.pinnable && pinnedCols[col.key];
                    const isStickyCol = col.key === 'folio' || isPinned;
                    const stickyStyle = isStickyCol && col.key !== 'folio'
                      ? { left: (stickyLefts[col.key] ?? 0) + 'px' }
                      : undefined;
                    return (
                    <td
                      key={col.key}
                      style={stickyStyle}
                      className={`px-3 py-2.5${textCellOpen ? '' : ' whitespace-nowrap'}${
                        isStickyCol
                          ? col.key === 'folio'
                            ? ` sticky left-0 z-10 ${stickyBg} group-hover:bg-gray-200 border-r border-gray-200`
                            : ` sticky z-10 ${stickyBg} group-hover:bg-gray-200 border-r border-gray-200`
                          : ''
                      }`}
                    >
                      {col.key === 'folio' ? (
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={isSelected} onChange={() => toggleOne(inv.id)} className="rounded border-gray-300 cursor-pointer" />
                          {renderCell(inv, col)}
                        </div>
                      ) : renderCell(inv, col)}
                    </td>
                    );
                  })}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      {inv.estado === 'PAGADO' ? (
                        <button
                          onClick={() => revertPagado(inv)}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                          title="Quitar pago (volver a pendiente)"
                        >
                          <Undo2 size={14} />
                        </button>
                      ) : inv.estado !== 'CANCELADA' ? (
                        <button
                          onClick={() => requestPagado(inv)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Marcar como pagado"
                        >
                          <Check size={14} />
                        </button>
                      ) : null}
                      <button
                        onClick={() => requestDeleteOne(inv.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-6 py-12 text-center text-gray-400">
                  No se encontraron facturas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagoModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setPagoModal(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-base font-semibold text-gray-900">Marcar como Pagado</h3>
              <button onClick={() => setPagoModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="text-sm text-gray-600">
                <p>
                  {pagoModal.serie || ''}{pagoModal.folio} — {pagoModal.nombre_display || pagoModal.nombre_receptor}
                </p>
                {pagoModal.cliente_alias && (
                  <p className="text-xs text-gray-500 mt-0.5">{pagoModal.nombre_receptor}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Fecha de pago</label>
                <input
                  type="date"
                  value={pagoFecha}
                  onChange={(e) => setPagoFecha(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && savePagado()}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t bg-gray-50 rounded-b-xl">
              <button onClick={() => setPagoModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={savePagado} disabled={!pagoFecha} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                Confirmar pago
              </button>
            </div>
          </div>
        </div>
      )}

      {aliasInvoice && (
        <AliasModal invoice={aliasInvoice} onClose={() => setAliasInvoice(null)} onSaved={onRefresh} />
      )}

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel="Confirmar"
          danger
          onConfirm={executeConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {paginationBar && <div className="border-t border-gray-200">{paginationBar}</div>}
    </div>
  );
}
