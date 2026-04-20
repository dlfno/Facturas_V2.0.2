import { useState, useEffect, useCallback } from 'react';
import { Eye } from 'lucide-react';
import DashboardCards from '../components/DashboardCards';
import DashboardCharts from '../components/DashboardCharts';
import ClientSelector from '../components/ClientSelector';
import FilterBar from '../components/FilterBar';
import ActiveFilterChips from '../components/ActiveFilterChips';
import RezagadasPanel from '../components/RezagadasPanel';
import { getDashboard, updateInvoice } from '../api';
import { useLiveUpdates } from '../LiveUpdatesContext';

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

const EMPTY_FILTERS = {
  estado: [],
  moneda: 'Todas',
  fecha_desde: '',
  fecha_hasta: '',
  fecha_tent_desde: '',
  fecha_tent_hasta: '',
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('consolidado');
  const [loading, setLoading] = useState(true);
  const [editingFechaId, setEditingFechaId] = useState(null);
  const [fechaValue, setFechaValue] = useState('');
  const [clientesList, setClientesList] = useState([]);
  const [selectedClientes, setSelectedClientes] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sinFechaPage, setSinFechaPage] = useState(1);
  const [proximasPage, setProximasPage] = useState(1);
  const [pendientesPage, setPendientesPage] = useState(1);

  const empresa = tab === 'consolidado' ? null : tab.toUpperCase();

  const fetchData = useCallback(() => {
    setLoading(true);
    getDashboard({
      empresa,
      clientes: selectedClientes.length > 0 ? selectedClientes : null,
      ...filters,
      proximasPage,
      revisionPage: sinFechaPage,
      pendientesPage,
    })
      .then((d) => {
        setData(d);
        if (d.clientesList) setClientesList(d.clientesList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [empresa, selectedClientes, filters, proximasPage, sinFechaPage, pendientesPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sincronización en vivo: refetch cuando otro usuario cambia algo relevante.
  useLiveUpdates(['invoices:changed', 'aliases:changed', 'settings:changed'], fetchData, 300);

  // Reset de páginas al cambiar filtros o cliente o empresa.
  useEffect(() => {
    setProximasPage(1);
    setSinFechaPage(1);
    setPendientesPage(1);
  }, [empresa, selectedClientes, filters]);

  const handleTabChange = (t) => {
    setSelectedClientes([]);
    setTab(t);
  };

  const clearAllFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSelectedClientes([]);
  };

  const saveFecha = async (id) => {
    if (!fechaValue) return;
    try {
      await updateInvoice(id, { fecha_tentativa_pago: fechaValue });
      setEditingFechaId(null);
      setFechaValue('');
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Vista general de cobranza</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ClientSelector
            clientes={clientesList}
            selected={selectedClientes}
            onChange={setSelectedClientes}
          />
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['consolidado', 'dlg', 'smgs'].map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
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
      </div>

      <FilterBar filters={filters} onChange={setFilters} hideCliente hideSearch />

      <ActiveFilterChips
        filters={filters}
        setFilters={setFilters}
        selectedClientes={selectedClientes}
        setSelectedClientes={setSelectedClientes}
        clientesList={clientesList}
        onClearAll={clearAllFilters}
      />

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
            topClientesTotal={data.topClientesTotal}
            topClientesTotalSinIVA={data.topClientesTotalSinIVA}
            topClientesGrandTotal={data.topClientesGrandTotal}
            topClientesGrandTotalSinIVA={data.topClientesGrandTotalSinIVA}
          />

          {/* Grid superior: Próximas a Vencer | Pendientes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(() => {
              const PV_PAGE_SIZE = data.sectionLimit || 20;
              const total = data.proximasVencerTotal ?? 0;
              const pages = Math.ceil(total / PV_PAGE_SIZE);
              const page = proximasPage;
              const slice = data.proximasVencer || [];
              return (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full" />
                    Próximas a Vencer ({total})
                  </h3>
                  {total > 0 ? (
                    <>
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
                            {slice.map((inv) => (
                              <tr key={inv.id} className="hover:bg-gray-50">
                                <td className="py-2 font-mono text-xs">
                                  {inv.serie || ''}{inv.folio}
                                </td>
                                <td className="py-2 max-w-[200px] truncate">
                                  {inv.nombre_display || inv.nombre_receptor}
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

                      {pages > 1 && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            {(page - 1) * PV_PAGE_SIZE + 1}–{Math.min(page * PV_PAGE_SIZE, total)} de {total}
                          </p>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setProximasPage((p) => p - 1)}
                              disabled={page <= 1}
                              className="px-2.5 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-40"
                            >
                              Anterior
                            </button>
                            <button
                              onClick={() => setProximasPage((p) => p + 1)}
                              disabled={page >= pages}
                              className="px-2.5 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-40"
                            >
                              Siguiente
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400 text-center py-6">
                      No hay facturas próximas a vencer
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Pendientes */}
            {(() => {
              const PND_PAGE_SIZE = data.sectionLimit || 20;
              const total = data.pendientesTotal ?? 0;
              const pages = Math.ceil(total / PND_PAGE_SIZE);
              const page = pendientesPage;
              const slice = data.pendientes || [];
              return (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                    Pendientes ({total})
                  </h3>
                  {total > 0 ? (
                    <>
                      <div className="overflow-auto max-h-64">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-500 border-b">
                              <th className="pb-2">CFDI</th>
                              <th className="pb-2">Cliente</th>
                              <th className="pb-2">Total</th>
                              <th className="pb-2">Emisión</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {slice.map((inv) => (
                              <tr key={inv.id} className="hover:bg-gray-50">
                                <td className="py-2 font-mono text-xs">
                                  {inv.serie || ''}{inv.folio}
                                </td>
                                <td className="py-2 max-w-[200px] truncate">
                                  {inv.nombre_display || inv.nombre_receptor}
                                </td>
                                <td className="py-2 font-mono">
                                  ${formatMoney(inv.total)}
                                </td>
                                <td className="py-2 text-gray-600">
                                  {formatDate(inv.fecha_emision)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {pages > 1 && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            {(page - 1) * PND_PAGE_SIZE + 1}–{Math.min(page * PND_PAGE_SIZE, total)} de {total}
                          </p>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setPendientesPage((p) => p - 1)}
                              disabled={page <= 1}
                              className="px-2.5 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-40"
                            >
                              Anterior
                            </button>
                            <button
                              onClick={() => setPendientesPage((p) => p + 1)}
                              disabled={page >= pages}
                              className="px-2.5 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-40"
                            >
                              Siguiente
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400 text-center py-6">
                      No hay facturas pendientes
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Grid inferior: Rezagadas | Facturas en Revisión */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RezagadasPanel empresa={empresa} />

            {/* Facturas en Revisión */}
            {(() => {
              const SF_PAGE_SIZE = data.sectionLimit || 20;
              const total = data.revisionTotal ?? 0;
              const pages = Math.ceil(total / SF_PAGE_SIZE);
              const page = sinFechaPage;
              const slice = data.revision || [];
              return (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Eye size={16} className="text-red-600" />
                    Facturas en Revisión
                    {total > 0 && (
                      <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                        {total}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Facturas emitidas hace 7 días o más sin fecha tentativa asignada. Asigna una fecha desde aquí.
                  </p>
                  {total > 0 ? (
                    <>
                      <div className="overflow-auto max-h-80">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-500 border-b">
                              <th className="pb-2">CFDI</th>
                              <th className="pb-2">Cliente</th>
                              <th className="pb-2">Total</th>
                              <th className="pb-2">Fecha Tentativa</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {slice.map((inv) => (
                              <tr key={inv.id} className="hover:bg-gray-50">
                                <td className="py-2 font-mono text-xs">
                                  {inv.serie || ''}{inv.folio}
                                </td>
                                <td className="py-2 max-w-[200px] truncate">
                                  {inv.nombre_display || inv.nombre_receptor}
                                </td>
                                <td className="py-2 font-mono">
                                  ${formatMoney(inv.total)}
                                </td>
                                <td className="py-2">
                                  {editingFechaId === inv.id ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="date"
                                        value={fechaValue}
                                        onChange={(e) => setFechaValue(e.target.value)}
                                        className="border rounded px-1.5 py-0.5 text-xs w-32"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveFecha(inv.id);
                                          if (e.key === 'Escape') setEditingFechaId(null);
                                        }}
                                      />
                                      <button
                                        onClick={() => saveFecha(inv.id)}
                                        className="text-green-600 hover:bg-green-50 rounded p-0.5 text-xs font-medium"
                                      >
                                        OK
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setEditingFechaId(inv.id); setFechaValue(''); }}
                                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      Asignar fecha
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {pages > 1 && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            {(page - 1) * SF_PAGE_SIZE + 1}–{Math.min(page * SF_PAGE_SIZE, total)} de {total}
                          </p>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setSinFechaPage((p) => p - 1)}
                              disabled={page <= 1}
                              className="px-2.5 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-40"
                            >
                              Anterior
                            </button>
                            <button
                              onClick={() => setSinFechaPage((p) => p + 1)}
                              disabled={page >= pages}
                              className="px-2.5 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-40"
                            >
                              Siguiente
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400 text-center py-6">
                      No hay facturas en revisión
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </>
      ) : (
        <p className="text-gray-400 text-center py-20">No hay datos disponibles</p>
      )}
    </div>
  );
}
