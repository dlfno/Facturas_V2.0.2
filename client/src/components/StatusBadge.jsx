const statusConfig = {
  'PAGADO': { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  'ON TRACK': { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  'PENDIENTE': { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  'PROXIMO A VENCER': { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  'VENCIDO': { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  'SIN FECHA': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-600' },
  'CANCELADA': { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig['PENDIENTE'];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}
