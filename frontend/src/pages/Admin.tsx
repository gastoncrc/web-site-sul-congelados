import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, Users, Package, Tag } from 'lucide-react';
import { api } from '../config/api';

// 1. Interfaz para las propiedades que recibimos de App.tsx
interface AdminProps {
  setStatusMessage: React.Dispatch<React.SetStateAction<string>>;
  triggerRefresh: () => Promise<void>;
}

// 2. Interfaz explícita para el formulario para que VS Code no tire error
interface IndividualFormState {
  sku: string;
  name: string;
  category: string;
  is_active: boolean;
  is_promo: boolean;
  promo_price: number;
}

export const Admin: React.FC<AdminProps> = ({ setStatusMessage, triggerRefresh }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'masivo' | 'clientes' | 'individual'>('masivo');
  
  // Estados para la carga de archivos masivos
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Formulario tipado de forma estricta para heredar las columnas de Neon
  const [indForm, setIndForm] = useState<IndividualFormState>({ 
    sku: '', 
    name: '', 
    category: '', 
    is_active: true, 
    is_promo: false, 
    promo_price: 0 
  });

  if (user?.role !== 'Admin') {
    return <div className="text-center p-10 text-red-500 font-bold">Acceso Denegado</div>;
  }

  const handleUpload = async (type: 'productos' | 'clientes') => {
    if (!file) {
      setStatusMessage('Por favor, seleccioná un archivo Excel.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const endpoint = type === 'productos' ? '/products/upload-prices' : '/auth/upload-clients';
      const res = await api.post(endpoint, formData);
      
      setStatusMessage(res.data.message);
      setFile(null);
      
      if (type === 'productos') {
        await triggerRefresh();
      }
    } catch (err: any) {
      setStatusMessage(err.response?.data?.error || 'Error en la carga masiva');
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products/individual', indForm);
      setStatusMessage('¡Producto guardado e impactado en el catálogo con éxito!');
      
      // Reseteo limpio respetando la estructura
      setIndForm({ sku: '', name: '', category: '', is_active: true, is_promo: false, promo_price: 0 });
      await triggerRefresh();
    } catch (err) {
      setStatusMessage('Ocurrió un error guardando el producto individual.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-black text-[#003366] uppercase">Consola de Administración</h2>
      
      {/* 🗂️ TABS DE NAVEGACIÓN */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button onClick={() => setActiveTab('masivo')} className={`px-4 py-2 font-bold text-sm rounded-t-lg transition ${activeTab === 'masivo' ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          <Upload size={16} className="inline mr-2" /> Masivo Productos
        </button>
        <button onClick={() => setActiveTab('clientes')} className={`px-4 py-2 font-bold text-sm rounded-t-lg transition ${activeTab === 'clientes' ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          <Users size={16} className="inline mr-2" /> Masivo Clientes
        </button>
        <button onClick={() => setActiveTab('individual')} className={`px-4 py-2 font-bold text-sm rounded-t-lg transition ${activeTab === 'individual' ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          <Package size={16} className="inline mr-2" /> Gestión Individual
        </button>
      </div>

      {/* 📦 TAB 1: MASIVO PRODUCTOS */}
      {activeTab === 'masivo' && (
        <div className="bg-white p-6 rounded-b-xl rounded-tr-xl shadow border border-gray-200">
          <h3 className="text-lg font-bold mb-4">Actualización Masiva de Listas y Precios (.xls)</h3>
          <input type="file" accept=".xls,.xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          <button onClick={() => handleUpload('productos')} disabled={loading || !file} className="mt-4 bg-[#003366] text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50">
            {loading ? 'Procesando...' : 'Inyectar Matriz de Precios'}
          </button>
        </div>
      )}

      {/* 👥 TAB 2: MASIVO CLIENTES */}
      {activeTab === 'clientes' && (
        <div className="bg-white p-6 rounded-b-xl rounded-tr-xl shadow border border-gray-200">
          <h3 className="text-lg font-bold mb-4">Alta Masiva de Clientes y Convenios (.xls)</h3>
          <input type="file" accept=".xls,.xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
          <button onClick={() => handleUpload('clientes')} disabled={loading || !file} className="mt-4 bg-green-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50">
            {loading ? 'Procesando...' : 'Sincronizar ERP Logístico'}
          </button>
        </div>
      )}

      {/* 🏷️ TAB 3: GESTIÓN INDIVIDUAL */}
      {activeTab === 'individual' && (
        <div className="bg-white p-6 rounded-b-xl rounded-tr-xl shadow border border-gray-200">
          <h3 className="text-lg font-bold mb-4">Crear o Editar Producto (Sobrescribe Masivo)</h3>
          <form onSubmit={handleIndividualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">SKU (Código Exacto)</label>
              <input type="text" required value={indForm.sku} onChange={e => setIndForm({...indForm, sku: e.target.value})} className="w-full mt-1 p-2 border rounded bg-gray-50" placeholder="Ej: 10045" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Nombre de Artículo</label>
              <input type="text" required value={indForm.name} onChange={e => setIndForm({...indForm, name: e.target.value})} className="w-full mt-1 p-2 border rounded bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Categoría</label>
              <input type="text" required value={indForm.category} onChange={e => setIndForm({...indForm, category: e.target.value})} className="w-full mt-1 p-2 border rounded bg-gray-50" />
            </div>
            
            <div className="md:col-span-2 flex items-center space-x-6 p-4 bg-orange-50 border border-orange-200 rounded-lg mt-2">
              <label className="flex items-center space-x-2 cursor-pointer font-bold text-orange-700">
                <input type="checkbox" checked={indForm.is_promo} onChange={e => setIndForm({...indForm, is_promo: e.target.checked})} className="form-checkbox h-5 w-5 text-orange-600 rounded" />
                <span><Tag size={16} className="inline mr-1"/> Destacar en Carrusel Promo</span>
              </label>
              
              {indForm.is_promo && (
                <div className="flex-1">
                  <label className="block text-xs font-bold text-orange-700 uppercase">Precio Promo ($)</label>
                  <input type="number" required={indForm.is_promo} value={indForm.promo_price} onChange={e => setIndForm({...indForm, promo_price: Number(e.target.value)})} className="w-full max-w-50 mt-1 p-2 border rounded" placeholder="Ej: 45000" />
                </div>
              )}
            </div>

            <div className="md:col-span-2 mt-4">
              <button type="submit" className="bg-[#003366] text-white px-6 py-2 rounded-lg font-bold w-full md:w-auto shadow-md">
                Guardar Artículo Individual
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};