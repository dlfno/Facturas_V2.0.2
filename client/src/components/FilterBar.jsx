import { Search, X } from 'lucide-react';
import MultiSelect from './MultiSelect';

const ESTADOS = [
  'PENDIENTE',
  'ON TRACK',
  'PROXIMO A VENCER',
  'VENCIDO',
  'PAGADO',
  'CANCELADA',
  'REVISIÓN',
];
const ESTADOS_ITEMS = ESTADOS.map((e) => ({ key: e, label: e }));

export default function FilterBar({ filters, onChange, clientes = [], hideCliente = false }) {
  const update = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const clear = () => {
    onChange({
      search: '',
      estado: [],
      moneda: 'Todas',
      fecha_desde: '',
      fecha_hasta: '',
      fecha_tent_desde: '',
      fecha_tent_hasta: '',
      cliente: '',
    });
  };

  const hasFilters =
    filters.search ||
    (filters.estado && filters.estado.length > 0) ||
    (filters.moneda && filters.moneda !== 'Todas') ||
    filters.fecha_desde ||
    filters.fecha_hasta ||
    filters.fecha_tent_desde ||
    filters.fecha_tent_hasta ||
    filters.cliente;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, RFC, folio fiscal, concepto, proyecto..."
            value={filters.search || ''}
            onChange={(e) => update('search', e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {hasFilters && (
          <button
            onClick={clear}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50"
          >
            <X size={14} />
            Limpiar
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Estado</label>
          <MultiSelect
            items={ESTADOS_ITEMS}
            selected={filters.estado || []}
            onChange={(arr) => update('estado', arr)}
            allLabel="Todos los estados"
            itemLabelSingular="estado"
            itemLabelPlural="estados"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Moneda</label>
          <select
            value={filters.moneda || 'Todas'}
            onChange={(e) => update('moneda', e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm"
          >
            <option value="Todas">Todas</option>
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha emisión desde</label>
          <input
            type="date"
            value={filters.fecha_desde || ''}
            onChange={(e) => update('fecha_desde', e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha emisión hasta</label>
          <input
            type="date"
            value={filters.fecha_hasta || ''}
            onChange={(e) => update('fecha_hasta', e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha tent. desde</label>
          <input
            type="date"
            value={filters.fecha_tent_desde || ''}
            onChange={(e) => update('fecha_tent_desde', e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha tent. hasta</label>
          <input
            type="date"
            value={filters.fecha_tent_hasta || ''}
            onChange={(e) => update('fecha_tent_hasta', e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm"
          />
        </div>

        {!hideCliente && clientes.length > 0 && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Cliente</label>
            <select
              value={filters.cliente || ''}
              onChange={(e) => update('cliente', e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-sm max-w-[200px]"
            >
              <option value="">Todos</option>
              {clientes.map((c) => (
                <option key={c} value={c}>
                  {c.length > 30 ? c.substring(0, 30) + '...' : c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
