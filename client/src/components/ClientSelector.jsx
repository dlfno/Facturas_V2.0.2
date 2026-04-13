import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export default function ClientSelector({ clientes = [], selected = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = clientes.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (key) => {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  };

  const allSelected = clientes.length > 0 && selected.length === clientes.length;

  const buttonLabel =
    selected.length === 0
      ? 'Todos los clientes'
      : selected.length === 1
      ? (clientes.find((c) => c.key === selected[0])?.label ?? '1 cliente')
      : `${selected.length} clientes`;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
          selected.length > 0
            ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        <span className="max-w-[200px] truncate">{buttonLabel}</span>
        {selected.length > 0 && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange([]); }}
            className="text-blue-400 hover:text-blue-700"
            title="Limpiar selección"
          >
            <X size={13} />
          </span>
        )}
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions row */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <button
              onClick={() => onChange(allSelected ? [] : clientes.map((c) => c.key))}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
            {selected.length > 0 && (
              <span className="text-xs text-gray-400">{selected.length} seleccionados</span>
            )}
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Sin resultados</p>
            ) : (
              filtered.map((c) => {
                const isChecked = selected.includes(c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => toggle(c.key)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      }`}
                    >
                      {isChecked && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-sm text-gray-700 truncate">{c.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
