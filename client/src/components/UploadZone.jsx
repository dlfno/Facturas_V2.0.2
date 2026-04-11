import { useState, useRef, useCallback } from 'react';
import { Upload, FolderOpen, CheckCircle, AlertCircle, X } from 'lucide-react';
import { uploadFiles } from '../api';

export default function UploadZone({ empresa, onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [manualEmpresa, setManualEmpresa] = useState(empresa || '');
  const fileRef = useRef();
  const dirRef = useRef();

  const handleFiles = useCallback(
    async (files) => {
      const xmlFiles = Array.from(files).filter((f) =>
        f.name.toLowerCase().endsWith('.xml')
      );
      if (xmlFiles.length === 0) {
        setResult({ error: 'No se encontraron archivos XML' });
        return;
      }

      setUploading(true);
      setResult(null);
      try {
        const res = await uploadFiles(xmlFiles, empresa || manualEmpresa || null);
        setResult(res);
        if (res.insertados > 0 && onUploaded) {
          onUploaded();
        }
      } catch (err) {
        setResult({ error: err.message });
      } finally {
        setUploading(false);
      }
    },
    [empresa, manualEmpresa, onUploaded]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-white'
        }`}
      >
        <Upload
          className={`mx-auto mb-3 ${dragging ? 'text-blue-500' : 'text-gray-400'}`}
          size={40}
        />
        <p className="text-sm text-gray-600 mb-3">
          {uploading
            ? 'Procesando archivos...'
            : 'Arrastra archivos XML aquí o usa los botones'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Upload size={16} />
            Seleccionar archivos
          </button>
          <button
            onClick={() => dirRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
          >
            <FolderOpen size={16} />
            Seleccionar carpeta
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xml"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={dirRef}
          type="file"
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {!empresa && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <label className="text-sm text-gray-500">Empresa:</label>
            <select
              value={manualEmpresa}
              onChange={(e) => setManualEmpresa(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">Auto-detectar</option>
              <option value="DLG">DLG</option>
              <option value="SMGS">SMGS</option>
            </select>
          </div>
        )}
      </div>

      {result && (
        <div
          className={`rounded-lg p-4 text-sm ${
            result.error
              ? 'bg-red-50 border border-red-200'
              : 'bg-green-50 border border-green-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              {result.error ? (
                <AlertCircle size={18} className="text-red-500 mt-0.5" />
              ) : (
                <CheckCircle size={18} className="text-green-500 mt-0.5" />
              )}
              <div>
                {result.error ? (
                  <p className="text-red-700">{result.error}</p>
                ) : (
                  <>
                    <p className="font-medium text-green-800">
                      {result.insertados} factura(s) cargada(s)
                    </p>
                    {result.duplicados > 0 && (
                      <p className="text-yellow-700">
                        {result.duplicados} duplicada(s) (omitidas)
                      </p>
                    )}
                    {result.errores?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-red-600 font-medium">
                          {result.errores.length} error(es):
                        </p>
                        <ul className="mt-1 space-y-0.5">
                          {result.errores.map((err, i) => (
                            <li key={i} className="text-red-600">
                              {err.archivo}: {err.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <button onClick={() => setResult(null)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
