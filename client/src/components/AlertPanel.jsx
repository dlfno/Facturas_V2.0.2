import { useState } from 'react';
import { AlertTriangle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

function AlertSection({ icon: Icon, color, title, count, items, copiedId, onCopy }) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;

  const colors = {
    red: 'bg-red-50 border-red-200 text-red-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  return (
    <div className={`rounded-lg border p-3 ${colors[color]}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <Icon size={18} />
          <span className="text-sm font-semibold">
            {count} {title}
          </span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && items.length > 0 && (
        <ul className="mt-2 space-y-1 max-h-40 overflow-auto">
          {items.map((inv) => (
            <li
              key={inv.id}
              onClick={() => onCopy(inv)}
              className="text-xs cursor-pointer hover:underline py-0.5 flex items-center gap-2"
              title="Click para copiar CFDI al portapapeles"
            >
              <span>
                {inv.folio && `${inv.serie || ''}${inv.folio} - `}
                {inv.nombre_receptor} - ${formatMoney(inv.total)} {inv.moneda}
                {inv.fecha_tentativa_pago && ` (Vence: ${inv.fecha_tentativa_pago})`}
              </span>
              {copiedId === inv.id && (
                <span className="text-green-600 font-semibold text-[10px] uppercase tracking-wide shrink-0">
                  Copiado
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatMoney(n) {
  return (n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

export default function AlertPanel({ alerts }) {
  const sinFecha = alerts?.sinFecha || [];
  const proxVencer = alerts?.proxVencer || [];
  const vencidas = alerts?.vencidas || [];
  const [copiedId, setCopiedId] = useState(null);

  if (sinFecha.length === 0 && proxVencer.length === 0 && vencidas.length === 0) {
    return null;
  }

  const handleCopy = (inv) => {
    const cfdi = `${inv.serie || ''}${inv.folio || ''}`;
    if (!cfdi) return;
    const done = () => {
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId((prev) => (prev === inv.id ? null : prev)), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(cfdi).then(done).catch(() => {});
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <AlertSection
        icon={AlertCircle}
        color="red"
        title="sin fecha tentativa"
        count={sinFecha.length}
        items={sinFecha}
        copiedId={copiedId}
        onCopy={handleCopy}
      />
      <AlertSection
        icon={Clock}
        color="orange"
        title="próximas a vencer"
        count={proxVencer.length}
        items={proxVencer}
        copiedId={copiedId}
        onCopy={handleCopy}
      />
      <AlertSection
        icon={AlertTriangle}
        color="red"
        title="vencidas"
        count={vencidas.length}
        items={vencidas}
        copiedId={copiedId}
        onCopy={handleCopy}
      />
    </div>
  );
}
