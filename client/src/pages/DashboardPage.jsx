import { useState, useEffect } from 'react';
import DashboardCards from '../components/DashboardCards';
import DashboardCharts from '../components/DashboardCharts';
import StatusBadge from '../components/StatusBadge';
import { getDashboard } from '../api';

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

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('consolidado');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const empresa = tab === 'consolidado' ? null : tab.toUpperCase();
    getDashboard(empresa)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Vista general de cobranza</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['consolidado', 'dlg', 'smgs'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'consolidado' ? 'Consolidado' : t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : data ? (
        <>
          <DashboardCards kpis={data.kpis} />
          <DashboardCharts
            statusCounts={data.statusCounts}
            monthlyChart={data.monthlyChart}
            topClientes={data.topClientes}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Proximas a vencer */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full" />
                Próximas a Vencer ({data.proximasVencer?.length || 0})
              </h3>
              {data.proximasVencer?.length > 0 ? (
                <div className="overflow-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b">
                        <th className="pb-2">CFDI</th>
                        <th className="pb-2">Cliente</th>
                        <th className="pb-2">Total</th>
                        <th className="pb-2">Vence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.proximasVencer.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50">
                          <td className="py-2 font-mono text-xs">
                            {inv.serie || ''}{inv.folio}
                          </td>
                          <td className="py-2 max-w-[200px] truncate">
                            {inv.nombre_receptor}
                          </td>
                          <td className="py-2 font-mono">
                            ${formatMoney(inv.total)}
                          </td>
                          <td className="py-2 text-orange-600 font-medium">
                            {formatDate(inv.fecha_tentativa_pago)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-6">
                  No hay facturas próximas a vencer
                </p>
              )}
            </div>

            {/* Sin fecha */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                Sin Fecha de Pago ({data.sinFecha?.length || 0})
              </h3>
              {data.sinFecha?.length > 0 ? (
                <div className="overflow-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b">
                        <th className="pb-2">CFDI</th>
                        <th className="pb-2">Cliente</th>
                        <th className="pb-2">Total</th>
                        <th className="pb-2">Emitida</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.sinFecha.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50">
                          <td className="py-2 font-mono text-xs">
                            {inv.serie || ''}{inv.folio}
                          </td>
                          <td className="py-2 max-w-[200px] truncate">
                            {inv.nombre_receptor}
                          </td>
                          <td className="py-2 font-mono">
                            ${formatMoney(inv.total)}
                          </td>
                          <td className="py-2">{formatDate(inv.fecha_emision)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-6">
                  Todas las facturas tienen fecha tentativa
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-400 text-center py-20">No hay datos disponibles</p>
      )}
    </div>
  );
}
