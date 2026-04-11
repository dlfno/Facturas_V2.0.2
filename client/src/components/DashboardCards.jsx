import {
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  FileText,
} from 'lucide-react';

function formatMoney(n) {
  return (n || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const cards = [
  {
    key: 'totalFacturadoMXN',
    label: 'Total Facturado',
    icon: DollarSign,
    color: 'blue',
    format: 'money',
  },
  {
    key: 'totalCobrado',
    label: 'Total Cobrado',
    icon: CheckCircle,
    color: 'green',
    format: 'money',
  },
  {
    key: 'totalPendiente',
    label: 'Pendiente de Cobro',
    icon: Clock,
    color: 'yellow',
    format: 'money',
  },
  {
    key: 'totalFacturas',
    label: 'Total Facturas',
    icon: FileText,
    color: 'slate',
    format: 'number',
  },
  {
    key: 'sinFechaCount',
    label: 'Sin Fecha Tentativa',
    icon: AlertCircle,
    color: 'red',
    format: 'number',
  },
  {
    key: 'vencidasCount',
    label: 'Vencidas',
    icon: AlertTriangle,
    color: 'red',
    format: 'number',
  },
];

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
};

const iconBg = {
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  yellow: 'bg-yellow-100',
  red: 'bg-red-100',
  slate: 'bg-slate-100',
};

export default function DashboardCards({ kpis }) {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map(({ key, label, icon: Icon, color, format }) => (
        <div
          key={key}
          className={`rounded-xl border p-4 ${colorClasses[color]}`}
        >
          <div className={`inline-flex p-2 rounded-lg ${iconBg[color]} mb-3`}>
            <Icon size={20} />
          </div>
          <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
          <p className="text-lg font-bold">
            {format === 'money' ? `$${formatMoney(kpis[key])}` : kpis[key]}
          </p>
        </div>
      ))}
    </div>
  );
}
