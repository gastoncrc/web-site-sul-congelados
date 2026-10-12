import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { api } from '../../config/api';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  endpoint: string;
  title: string;
  hint: string;
  onSuccess: () => void;
  setSystemMessage: (msg: string) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, endpoint, title, hint, onSuccess, setSystemMessage }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) return setSystemMessage('Seleccioná un archivo Excel o CSV.');
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post(endpoint, formData);
      setSystemMessage(`✅ ${response.data.message}`);
      setFile(null);
      onSuccess();
      onClose();
    } catch (err) {
      setSystemMessage('🚨 Error procesando el archivo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-paper w-full max-w-md rounded-card shadow-xl overflow-hidden">
        <div className="p-5 bg-brand-primary text-white flex justify-between items-center">
          <h3 className="font-black uppercase text-sm tracking-wider flex items-center">
            <Upload size={16} className="mr-2 text-brand-gold" /> {title}
          </h3>
          <button onClick={onClose} className="text-white/60 hover:text-white font-black cursor-pointer">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-ink-soft">{hint}</p>
          <div className="bg-bg p-6 rounded-card border-2 border-dashed border-line text-center">
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" id="bulk-import-file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <label htmlFor="bulk-import-file" className="cursor-pointer block text-sm text-ink-soft font-medium py-2 hover:text-ink transition">
              {file ? `Seleccionado: ${file.name}` : 'Hacé click para elegir el archivo'}
            </label>
          </div>
          <button
            onClick={handleUpload}
            disabled={isLoading || !file}
            className="w-full bg-brand-primary text-brand-primary-on py-3 rounded-xl font-bold hover:bg-brand-accent transition disabled:opacity-50 text-sm cursor-pointer shadow-md"
          >
            {isLoading ? 'Procesando...' : 'Sincronizar'}
          </button>
        </div>
      </div>
    </div>
  );
};
