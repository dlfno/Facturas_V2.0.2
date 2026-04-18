import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const STATUS_COLORS = {
  'PAGADO': '#27ae60',
  'ON TRACK': '#2ecc71',
  'PENDIENTE': '#f39c12',
  'PROXIMO A VENCER': '#e67e22',
  'VENCIDO': '#e74c3c',
  'REVISIÓN': '#c0392b',
  'CANCELADA': '#95a5a6',
};

const MONTHS_ES = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

function formatMoneyShort(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatMoney(n) {
  return `$${(n || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function DashboardCharts({ statusCounts, monthlyChart, topClientes, topClientesTotal, topClientesGrandTotal }) {
  // Pie chart data
  const pieData = Object.entries(statusCounts || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // Monthly chart with Spanish month names
  const monthlyData = (monthlyChart || []).map((item) => {
    const [year, month] = item.mes.split('-');
    return {
      ...item,
      label: `${MONTHS_ES[month]} ${year.slice(2)}`,
    };
  });

  // Top clientes - truncate to 15 chars for single-line display
  const clientesData = (topClientes || []).map((item) => ({
    ...item,
    label: item.cliente.length > 15 ? item.cliente.substring(0, 15) + '...' : item.cliente,
  }));

  // Dynamic height for top clientes based on count
  const clientesHeight = Math.max(250, clientesData.length * 36);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Pie: Status distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Distribución por Estado
        </h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={85}
                dataKey="value"
                label={false}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] || '#bdc3c7'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value, name]}
                contentStyle={{ fontSize: '12px' }}
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                formatter={(value, entry) => (
                  <span className="text-gray-600">
                    {value}: {entry.payload.value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-12">Sin datos</p>
        )}
      </div>

      {/* Bar: Monthly billing */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Facturación Mensual (MXN)
        </h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={formatMoneyShort}
              />
              <Tooltip formatter={(v) => formatMoney(v)} labelFormatter={(l) => l} />
              <Bar dataKey="monto" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Monto" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-12">Sin datos</p>
        )}
      </div>

      {/* Bar: Top clients */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Top 10 Clientes (Pendiente)
        </h3>
        {clientesData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={clientesHeight}>
              <BarChart data={clientesData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatMoneyShort} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, width: 130 }}
                  width={140}
                  interval={0}
                />
                <Tooltip
                  formatter={(v) => formatMoney(v)}
                  labelFormatter={(label) => {
                    const item = clientesData.find((c) => c.label === label);
                    return item ? item.cliente : label;
                  }}
                />
                <Bar dataKey="monto" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Pendiente" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
            {topClientesTotal !== undefined && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-baseline justify-between">
                <span className="text-xs text-gray-500">Total top 10</span>
                <span className="text-sm font-semibold text-gray-800">{formatMoney(topClientesTotal)}</span>
              </div>
            )}
            {topClientesGrandTotal !== undefined && topClientesGrandTotal > topClientesTotal && (
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[11px] text-gray-400">Total pendiente (todos los clientes)</span>
                <span className="text-xs text-gray-500">{formatMoney(topClientesGrandTotal)}</span>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-400 text-center py-12">Sin pendientes</p>
        )}
      </div>
    </div>
  );
}
