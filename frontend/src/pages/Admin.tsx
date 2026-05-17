import React, { useState } from 'react';
import { Shield, Upload, FileText, Users } from 'lucide-react';
import { api } from '../config/api';

interface AdminProps {
  setStatusMessage: (msg: string) => void;
  triggerRefresh: () => void;
}

export const Admin: React.FC<AdminProps> = ({ setStatusMessage, triggerRefresh }) => {
  const [excelProducts, setExcelProducts] = useState<File | null>(null);
  const [excelClients, setExcelClients] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleProductsUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelProducts) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', excelProducts);

    try {
      const res = await api.post('/products/upload-prices', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatusMessage(`📦 ${res.data.message}`);
      setExcelProducts(null);
      triggerRefresh();
    } catch (err) {
      setStatusMessage('❌ Error procesando la lista de convenios.');
    } finally {
      setLoading(false);
    }
  };

  const handleClientsUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelClients) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', excelClients);

    try {
      const res = await api.post('/auth/upload-clients', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatusMessage(`👥 ${res.data.message}`);
      setExcelClients(null);
    } catch (err) {
      setStatusMessage('❌ Error estructurando el padrón de clientes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-black text-[#003366] uppercase flex items-center space-x-2">
          <Shield className="text-yellow-500" /> <span>Consola de Administración Central</span>
        </h2>
        <p className="text-sm text-gray-500">Sincronizá las bases de datos de SUL subiendo las planillas nativas .xls del sistema comercial.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COMPONENTE PRODUCTOS */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-[#003366] font-bold mb-3">
              <Upload size={18} />
              <h3>Actualizar Precios y Productos</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">Sube el archivo "CONVENIOS.XLS" para actualizar la matriz de precios ciegos cruzados por listas.</p>
          </div>
          <form onSubmit={handleProductsUpload} className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center bg-gray-50 relative">
              <input type="file" accept=".xls,.xlsx" onChange={(e) => setExcelProducts(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <FileText className="mx-auto text-blue-500 mb-2" size={28} />
              <p className="text-xs font-bold text-gray-700 truncate">{excelProducts ? excelProducts.name : 'Arrastrá tu convenios.xls'}</p>
            </div>
            <button type="submit" disabled={!excelProducts || loading} className="w-full bg-[#003366] text-white py-2.5 rounded-lg text-xs font-bold hover:bg-blue-800 transition disabled:opacity-50">
              {loading ? 'Sincronizando...' : 'Procesar Excel de Convenios'}
            </button>
          </form>
        </div>

        {/* COMPONENTE CLIENTES */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 font-bold mb-3">
              <Users size={18} />
              <h3>Sincronizar Padrón de Clientes</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">Sube el archivo "CLIENTES.XLS" para dar de alta locales, modificar convenios asignados o registrar bajas.</p>
          </div>
          <form onSubmit={handleClientsUpload} className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center bg-gray-50 relative">
              <input type="file" accept=".xls,.xlsx" onChange={(e) => setExcelClients(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <Users className="mx-auto text-emerald-500 mb-2" size={28} />
              <p className="text-xs font-bold text-gray-700 truncate">{excelClients ? excelClients.name : 'Arrastrá tu clientes.xls'}</p>
            </div>
            <button type="submit" disabled={!excelClients || loading} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50">
              {loading ? 'Sincronizando...' : 'Procesar Excel de Clientes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};