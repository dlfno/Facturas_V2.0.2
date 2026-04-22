export default function ClientNameCell({ invoice, maxWidthClass = 'max-w-xs', children }) {
  const alias = invoice.cliente_alias;
  const nombreReceptor = invoice.nombre_receptor;
  const nombreDisplay = invoice.nombre_display || nombreReceptor;

  return (
    <div className={`flex items-center gap-1 ${maxWidthClass}`}>
      <div className="min-w-0 flex-1">
        <div className="truncate" title={nombreDisplay}>
          {nombreDisplay}
        </div>
        {alias && (
          <div
            className="truncate text-xs text-gray-500"
            title={nombreReceptor}
          >
            {nombreReceptor}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
