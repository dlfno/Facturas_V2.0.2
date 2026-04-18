import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, FileSearch, CheckCircle2 } from 'lucide-react';
import { getRezagadas } from '../api';

export default function RezagadasPanel({ empresa }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    setLoading(true);
    getRezagadas({ empresa })
      .then((d) => setData(d))
      .catch((err) => {
        console.error('Error cargando rezagadas:', err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [empresa]);

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const groupsWithMissing = (data || []).filter((g) => g.missingCount > 0);
  const totalMissing = groupsWithMissing.reduce((s, g) => s + g.missingCount, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <FileSearch size={16} className="text-purple-600" />
        Facturas Rezagadas
        {totalMissing > 0 && (
          <span className="ml-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
            {totalMissing}
          </span>
        )}
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
        </div>
      ) : groupsWithMissing.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-gray-400">
          <CheckCircle2 size={24} className="text-green-500 mb-2" />
          <p className="text-sm">No se detectaron folios faltantes en las series subidas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 mb-2">
            Folios ausentes en la secuencia numérica por empresa y serie. Las facturas canceladas cuentan como folio presente.
          </p>
          {groupsWithMissing.map((g) => {
            const key = `${g.empresa}:${g.serie || ''}:${g.prefix}`;
            const isOpen = expanded[key];
            const serieLabel = g.serie || '(sin serie)';
            const prefixLabel = g.prefix ? ` · prefijo "${g.prefix}"` : '';
            return (
              <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggle(key)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isOpen ? (
                      <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {g.empresa} · Serie {serieLabel}
                      {prefixLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600 flex-shrink-0">
                    <span>
                      Rango: <span className="font-mono">{g.rangeMin}</span>–
                      <span className="font-mono">{g.rangeMax}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-semibold">
                      {g.missingCount} faltante{g.missingCount === 1 ? '' : 's'}
                    </span>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                    <div className="flex flex-wrap gap-1.5">
                      {g.missing.map((folio) => (
                        <span
                          key={folio}
                          className="inline-block px-2 py-0.5 text-xs font-mono bg-white border border-purple-200 text-purple-700 rounded"
                        >
                          {folio}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
