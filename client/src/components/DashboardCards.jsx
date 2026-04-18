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

function formatCount(n) {
  return (n || 0).toLocaleString('es-MX');
}

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

function Card({ icon: Icon, label, color, value, subValue, subLabel }) {
  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className={`inline-flex p-2 rounded-lg ${iconBg[color]} mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
      <p className="text-lg font-bold leading-tight">{value}</p>
      {subValue !== undefined && (
        <p className="text-[11px] font-medium opacity-70 mt-1">
          {subLabel}: {subValue}
        </p>
      )}
    </div>
  );
}

export default function DashboardCards({ kpis }) {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card
        icon={DollarSign}
        label="Total Facturado"
        color="blue"
        value={`$${formatMoney(kpis.totalFacturadoConIVA)}`}
        subValue={`$${formatMoney(kpis.totalFacturadoSinIVA)}`}
        subLabel="Sin IVA"
      />
      <Card
        icon={CheckCircle}
        label="Total Cobrado"
        color="green"
        value={`$${formatMoney(kpis.totalCobradoConIVA)}`}
        subValue={`$${formatMoney(kpis.totalCobradoSinIVA)}`}
        subLabel="Sin IVA"
      />
      <Card
        icon={Clock}
        label="Pendiente de Cobro"
        color="yellow"
        value={`$${formatMoney(kpis.totalPendienteConIVA)}`}
        subValue={`$${formatMoney(kpis.totalPendienteSinIVA)}`}
        subLabel="Sin IVA"
      />
      <Card
        icon={FileText}
        label="Total Facturas"
        color="slate"
        value={formatCount(kpis.totalFacturas)}
        subValue={`${formatCount(kpis.totalActivas)} · Canc. ${formatCount(kpis.totalCanceladas)}`}
        subLabel="Activas"
      />
      <Card
        icon={AlertCircle}
        label="Sin Fecha Tentativa"
        color="red"
        value={formatCount(kpis.sinFechaCount)}
      />
      <Card
        icon={AlertTriangle}
        label="Vencidas"
        color="red"
        value={formatCount(kpis.vencidasCount)}
      />
    </div>
  );
}
