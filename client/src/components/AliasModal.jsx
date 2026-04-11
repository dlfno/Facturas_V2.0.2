import { useState } from 'react';
import { X } from 'lucide-react';
import { saveAlias } from '../api';

export default function AliasModal({ invoice, onClose, onSaved }) {
  const [alias, setAlias] = useState(invoice.cliente_alias || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!alias.trim()) {
      setError('El alias no puede estar vacío');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveAlias(invoice.rfc_receptor, alias.trim(), invoice.nombre_receptor);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Asignar Alias de Cliente</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">RFC</label>
            <p className="font-mono text-sm bg-gray-50 rounded-lg px-3 py-2">{invoice.rfc_receptor}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre en XML</label>
            <p className="text-sm bg-gray-50 rounded-lg px-3 py-2 break-words">{invoice.nombre_receptor}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Alias (nombre visible)</label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej: Citibanamex"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <p className="text-xs text-gray-400 mt-1">
              Se aplicará a todas las facturas con este RFC
            </p>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar alias'}
          </button>
        </div>
      </div>
    </div>
  );
}
