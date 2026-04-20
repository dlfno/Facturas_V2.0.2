import { useState, useEffect, useCallback } from 'react';
import UploadZone from '../components/UploadZone';
import FilterBar from '../components/FilterBar';
import AlertPanel from '../components/AlertPanel';
import InvoiceTable from '../components/InvoiceTable';
import ExportButton from '../components/ExportButton';
import { getInvoices } from '../api';
import { useLiveUpdates } from '../LiveUpdatesContext';

const EMPTY_FILTERS = {
  search: '',
  estado: [],
  moneda: 'Todas',
  fecha_desde: '',
  fecha_hasta: '',
  fecha_tent_desde: '',
  fecha_tent_hasta: '',
  clientes: [],
};
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function CompanyPage({ empresa }) {
  const [invoices, setInvoices] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState('fecha_emision');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInvoices({
        empresa,
        ...filters,
        page,
        limit,
        sort,
        order,
      });
      setInvoices(res.data);
      setPagination(res.pagination);
      setClientes(res.clientes || []);
      setAlerts(res.alerts || null);
    } catch (err) {
      console.error('Error cargando facturas:', err);
    } finally {
      setLoading(false);
    }
  }, [empresa, filters, page, limit, sort, order]);

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sincronización en vivo: refetch cuando otro usuario cambia facturas o alias.
  useLiveUpdates(['invoices:changed', 'aliases:changed'], fetchData, 300);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSort = (key) => {
    if (sort === key) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(key);
      setOrder('asc');
    }
    setPage(1);
  };

  const exportFilters = {
    empresa,
    ...Object.fromEntries(
      Object.entries(filters).filter(([, v]) => {
        if (Array.isArray(v)) return v.length > 0;
        return v && v !== 'TODOS' && v !== 'Todas';
      })
    ),
  };

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{empresa}</h1>
          <p className="text-sm text-gray-500">
            {pagination ? `${pagination.total} facturas` : 'Cargando...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton filters={exportFilters} />
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            {showUpload ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Cargar XML
          </button>
        </div>
      </div>

      {showUpload && (
        <UploadZone empresa={empresa} onUploaded={fetchData} />
      )}

      <AlertPanel alerts={alerts} />

      <FilterBar filters={filters} onChange={handleFilterChange} clientes={clientes} />

      <InvoiceTable
        invoices={invoices}
        sort={sort}
        order={order}
        onSort={handleSort}
        onRefresh={fetchData}
        pagination={pagination}
        onPageChange={setPage}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
}
