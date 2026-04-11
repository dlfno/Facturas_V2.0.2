import { Download } from 'lucide-react';
import { getExportUrl } from '../api';

export default function ExportButton({ filters }) {
  const handleExport = () => {
    const url = getExportUrl(filters);
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
    >
      <Download size={16} />
      Exportar a Excel
    </button>
  );
}
