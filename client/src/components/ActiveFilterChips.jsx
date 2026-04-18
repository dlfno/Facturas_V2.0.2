import { X } from 'lucide-react';

function formatDate(d) {
  if (!d) return '';
  const parts = d.substring(0, 10).split('-');
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
      <span className="font-medium">{label}</span>
      <button
        onClick={onRemove}
        className="text-blue-500 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors"
        title="Remover filtro"
      >
        <X size={12} />
      </button>
    </span>
  );
}

export default function ActiveFilterChips({
  filters,
  setFilters,
  selectedClientes = [],
  setSelectedClientes,
  clientesList = [],
  onClearAll,
}) {
  const chips = [];

  if (filters.search) {
    chips.push({
      key: 'search',
      label: `Búsqueda: "${filters.search}"`,
      onRemove: () => setFilters({ ...filters, search: '' }),
    });
  }
  const estadoList = Array.isArray(filters.estado) ? filters.estado : [];
  for (const e of estadoList) {
    chips.push({
      key: `estado:${e}`,
      label: `Estado: ${e}`,
      onRemove: () =>
        setFilters({ ...filters, estado: estadoList.filter((x) => x !== e) }),
    });
  }
  if (filters.moneda && filters.moneda !== 'Todas') {
    chips.push({
      key: 'moneda',
      label: `Moneda: ${filters.moneda}`,
      onRemove: () => setFilters({ ...filters, moneda: 'Todas' }),
    });
  }
  if (filters.fecha_desde || filters.fecha_hasta) {
    const desde = filters.fecha_desde ? formatDate(filters.fecha_desde) : '...';
    const hasta = filters.fecha_hasta ? formatDate(filters.fecha_hasta) : '...';
    chips.push({
      key: 'fecha_emision',
      label: `Emisión: ${desde} → ${hasta}`,
      onRemove: () => setFilters({ ...filters, fecha_desde: '', fecha_hasta: '' }),
    });
  }
  if (filters.fecha_tent_desde || filters.fecha_tent_hasta) {
    const desde = filters.fecha_tent_desde ? formatDate(filters.fecha_tent_desde) : '...';
    const hasta = filters.fecha_tent_hasta ? formatDate(filters.fecha_tent_hasta) : '...';
    chips.push({
      key: 'fecha_tent',
      label: `Fecha tent.: ${desde} → ${hasta}`,
      onRemove: () => setFilters({ ...filters, fecha_tent_desde: '', fecha_tent_hasta: '' }),
    });
  }

  for (const key of selectedClientes) {
    const label = clientesList.find((c) => c.key === key)?.label || key;
    chips.push({
      key: `cliente:${key}`,
      label: `Cliente: ${label.length > 25 ? label.substring(0, 25) + '…' : label}`,
      onRemove: () => setSelectedClientes(selectedClientes.filter((k) => k !== key)),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <Chip key={c.key} label={c.label} onRemove={c.onRemove} />
      ))}
      {chips.length > 1 && onClearAll && (
        <button
          onClick={onClearAll}
          className="text-xs text-gray-500 hover:text-gray-700 hover:underline ml-1"
        >
          Limpiar todo
        </button>
      )}
    </div>
  );
}
