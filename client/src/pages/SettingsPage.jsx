import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Check, X, RefreshCw } from 'lucide-react';
import { getRfcs, addRfc, deleteRfc, reassignRfcs, getAliases, saveAlias, deleteAlias } from '../api';
import ConfirmModal from '../components/ConfirmModal';

export default function SettingsPage() {
  const [rfcs, setRfcs] = useState([]);
  const [newRfc, setNewRfc] = useState('');
  const [newEmpresa, setNewEmpresa] = useState('DLG');
  const [rfcError, setRfcError] = useState('');
  const [rfcSuccess, setRfcSuccess] = useState('');

  const [aliases, setAliases] = useState([]);
  const [editingAliasId, setEditingAliasId] = useState(null);
  const [editAliasValue, setEditAliasValue] = useState('');
  const [aliasError, setAliasError] = useState('');

  const [confirmAction, setConfirmAction] = useState(null);

  const fetchRfcs = () => getRfcs().then(setRfcs).catch(console.error);
  const fetchAliases = () => getAliases().then(setAliases).catch(console.error);

  useEffect(() => {
    fetchRfcs();
    fetchAliases();
  }, []);

  const handleAddRfc = async () => {
    if (!newRfc.trim()) return;
    setRfcError('');
    setRfcSuccess('');
    try {
      const res = await addRfc(newRfc.trim().toUpperCase(), newEmpresa);
      setNewRfc('');
      fetchRfcs();
      if (res.reassigned > 0) {
        setRfcSuccess(`RFC agregado. ${res.reassigned} factura(s) reasignada(s) a ${newEmpresa}.`);
      }
    } catch (err) {
      setRfcError(err.message);
    }
  };

  const handleReassign = async () => {
    setRfcError('');
    setRfcSuccess('');
    try {
      const res = await reassignRfcs();
      if (res.reassigned > 0) {
        setRfcSuccess(`${res.reassigned} factura(s) reasignada(s) según la configuración actual de RFCs.`);
      } else {
        setRfcSuccess('Todas las facturas ya están asignadas correctamente.');
      }
    } catch (err) {
      setRfcError(err.message);
    }
  };

  const requestDeleteRfc = (id) => {
    setConfirmAction({
      title: 'Eliminar RFC',
      message: '¿Eliminar este RFC de la configuración?',
      action: async () => {
        await deleteRfc(id);
        fetchRfcs();
      },
    });
  };

  const startEditAlias = (a) => {
    setEditingAliasId(a.id);
    setEditAliasValue(a.alias);
  };

  const saveEditAlias = async (a) => {
    if (!editAliasValue.trim()) return;
    setAliasError('');
    try {
      await saveAlias(a.rfc_receptor, editAliasValue.trim(), a.nombre_original);
      setEditingAliasId(null);
      fetchAliases();
    } catch (err) {
      setAliasError(err.message);
    }
  };

  const requestDeleteAlias = (id) => {
    setConfirmAction({
      title: 'Eliminar alias',
      message: '¿Eliminar este alias? Se mostrará el nombre original del XML.',
      action: async () => {
        await deleteAlias(id);
        fetchAliases();
      },
    });
  };

  const executeConfirm = async () => {
    if (confirmAction?.action) {
      try {
        await confirmAction.action();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
    setConfirmAction(null);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">
          RFCs de empresas y alias de clientes
        </p>
      </div>

      {/* Section 1: RFCs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">RFCs por Empresa</h2>
          <button
            onClick={handleReassign}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
            title="Reasignar facturas existentes según los RFCs configurados"
          >
            <RefreshCw size={14} />
            Reasignar facturas
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          El RFC del emisor en el XML determina si la factura pertenece a DLG o SMGS.
          Al agregar un RFC, las facturas existentes con ese emisor se reasignan automáticamente.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="RFC del emisor"
            value={newRfc}
            onChange={(e) => setNewRfc(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleAddRfc()}
          />
          <select
            value={newEmpresa}
            onChange={(e) => setNewEmpresa(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="DLG">DLG</option>
            <option value="SMGS">SMGS</option>
          </select>
          <button
            onClick={handleAddRfc}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            Agregar
          </button>
        </div>

        {rfcError && <p className="text-red-600 text-sm mb-3">{rfcError}</p>}
        {rfcSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700 mb-3">
            {rfcSuccess}
          </div>
        )}

        <div className="divide-y">
          {rfcs.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3">
              <div>
                <span className="font-mono text-sm font-medium">{r.rfc}</span>
                <span
                  className={`ml-3 inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    r.empresa === 'DLG'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {r.empresa}
                </span>
              </div>
              <button
                onClick={() => requestDeleteRfc(r.id)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {rfcs.length === 0 && (
            <p className="py-4 text-gray-400 text-center">No hay RFCs configurados</p>
          )}
        </div>
      </div>

      {/* Section 2: Aliases */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Alias de Clientes</h2>
        <p className="text-sm text-gray-500 mb-4">
          Asigna nombres cortos a los clientes. El alias se muestra en lugar del nombre largo del XML.
          También puedes asignar alias directamente desde la tabla de facturas con el botón de etiqueta.
        </p>

        {aliasError && <p className="text-red-600 text-sm mb-3">{aliasError}</p>}

        {aliases.length > 0 ? (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 pr-3">RFC</th>
                  <th className="pb-2 pr-3">Nombre XML</th>
                  <th className="pb-2 pr-3">Alias</th>
                  <th className="pb-2 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {aliases.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-3 font-mono text-xs">{a.rfc_receptor}</td>
                    <td className="py-2.5 pr-3 text-gray-500 max-w-[200px] truncate" title={a.nombre_original}>
                      {a.nombre_original || '-'}
                    </td>
                    <td className="py-2.5 pr-3">
                      {editingAliasId === a.id ? (
                        <input
                          type="text"
                          value={editAliasValue}
                          onChange={(e) => setEditAliasValue(e.target.value)}
                          className="border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditAlias(a);
                            if (e.key === 'Escape') setEditingAliasId(null);
                          }}
                        />
                      ) : (
                        <span className="font-medium">{a.alias}</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1">
                        {editingAliasId === a.id ? (
                          <>
                            <button
                              onClick={() => saveEditAlias(a)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Guardar"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              onClick={() => setEditingAliasId(null)}
                              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                              title="Cancelar"
                            >
                              <X size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditAlias(a)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Editar alias"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => requestDeleteAlias(a.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                              title="Eliminar alias"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-4 text-gray-400 text-center">
            No hay alias configurados. Asígnalos desde la tabla de facturas.
          </p>
        )}
      </div>

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel="Eliminar"
          danger
          onConfirm={executeConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
