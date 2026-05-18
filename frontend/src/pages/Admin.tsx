import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, Users, Package, Tag, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { api } from '../config/api';

interface AdminProps {
  setStatusMessage: React.Dispatch<React.SetStateAction<string>>;
  triggerRefresh: () => Promise<void>;
}

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
  
  // Solo dos pestañas principales ahora
  const [activeTab, setActiveTab] = useState<'productos' | 'clientes'>('productos');
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Tabla de productos del Admin
  const [adminList, setAdminList] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false); // Para saber si estamos editando o creando

  const [indForm, setIndForm] = useState<IndividualFormState>({ 
    sku: '', name: '', category: '', is_active: true, is_promo: false, promo_price: 0 
  });

  const fetchAdminProducts = async () => {
    try {
      const res = await api.get('/products/admin');
      setAdminList(res.data);
    } catch (err) {
      console.error("Error cargando tabla admin", err);
    }
  };

  // Traer los productos cuando entramos a la pestaña
  useEffect(() => {
    if (activeTab === 'productos') fetchAdminProducts();
  }, [activeTab]);

  if (user?.role !== 'Admin') {
    return <div className="text-center p-10 text-red-500 font-bold">Acceso Denegado</div>;
  }

  // --- FUNCIONES MASIVAS ---
  const handleUpload = async (type: 'productos' | 'clientes') => {
    if (!file) return setStatusMessage('Por favor, seleccioná un archivo Excel.');
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const endpoint = type === 'productos' ? '/products/upload-prices' : '/auth/upload-clients';
      const res = await api.post(endpoint, formData);
      setStatusMessage(res.data.message);
      setFile(null);
      if (type === 'productos') {
        await fetchAdminProducts();
        await triggerRefresh();
      }
    } catch (err: any) {
      setStatusMessage(err.response?.data?.error || 'Error en la carga masiva');
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIONES INDIVIDUALES ---
  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products/individual', indForm);
      setStatusMessage(isEditing ? 'Producto actualizado con éxito' : 'Producto creado con éxito');
      setIndForm({ sku: '', name: '', category: '', is_active: true, is_promo: false, promo_price: 0 });
      setIsEditing(false);
      await fetchAdminProducts();
      await triggerRefresh();
    } catch (err) {
      setStatusMessage('Error guardando el producto.');
    }
  };

  // Carga los datos del producto en el formulario
  const handleEditClick = (product: any) => {
    setIndForm({
      sku: product.sku,
      name: product.name,
      category: product.category,
      is_active: product.is_active,
      is_promo: product.is_promo,
      promo_price: product.promo_price ? Number(product.promo_price) : 0
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Sube la pantalla al form
  };

  const handleToggleActive = async (sku: string, currentStatus: boolean) => {
    try {
      await api.patch(`/products/${sku}/flags`, { is_active: !currentStatus });
      setStatusMessage(!currentStatus ? 'Producto Reactivado' : 'Producto Inactivado');
      await fetchAdminProducts();
      await triggerRefresh();
    } catch (err) {
      setStatusMessage('Error al cambiar el estado.');
    }
  };

  const handleDelete = async (sku: string) => {
    if (!window.confirm(`¿Estás seguro de ELIMINAR el SKU ${sku}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/products/${sku}`);
      setStatusMessage('Producto borrado de la base de datos.');
      await fetchAdminProducts();
      await triggerRefresh();
    } catch (err) {
      setStatusMessage('Error al eliminar. Verificá tu conexión.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-black text-[#003366] uppercase">Consola de Administración</h2>
      
      {/* 🗂️ PESTAÑAS PRINCIPALES */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button onClick={() => setActiveTab('productos')} className={`px-4 py-2 font-bold text-sm rounded-t-lg transition flex items-center ${activeTab === 'productos' ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          <Package size={16} className="mr-2" /> Central de Productos
        </button>
        <button onClick={() => setActiveTab('clientes')} className={`px-4 py-2 font-bold text-sm rounded-t-lg transition flex items-center ${activeTab === 'clientes' ? 'bg-[#003366] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          <Users size={16} className="mr-2" /> Central de Clientes
        </button>
      </div>

      {/* 📦 TAB 1: PRODUCTOS (CONTIENE TODO) */}
      {activeTab === 'productos' && (
        <div className="space-y-6">
          
          {/* Zona de Trabajo: Masivo + Formulario */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Tarjeta Carga Masiva */}
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center"><Upload className="mr-2 text-blue-500" size={20}/> Carga Masiva (.xls)</h3>
                <p className="text-xs text-gray-500 mb-4">Actualizá precios, convenios y listados enteros desde tu sistema comercial ERP.</p>
                <input type="file" accept=".xls,.xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              <button onClick={() => handleUpload('productos')} disabled={loading || !file} className="mt-6 w-full bg-[#003366] text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 transition">
                {loading ? 'Sincronizando Base...' : 'Inyectar Matriz de Precios'}
              </button>
            </div>

            {/* Tarjeta Carga/Edición Individual */}
            <div className={`bg-white p-6 rounded-xl shadow border ${isEditing ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-200'}`}>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                {isEditing ? <><Edit className="mr-2 text-orange-500" size={20}/> Editando Producto: {indForm.sku}</> : <><Package className="mr-2 text-blue-500" size={20}/> Crear Producto Nuevo</>}
              </h3>
              
              <form onSubmit={handleIndividualSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700">SKU (CÓDIGO)</label>
                  <input type="text" required disabled={isEditing} value={indForm.sku} onChange={e => setIndForm({...indForm, sku: e.target.value})} className="w-full mt-1 p-2 border rounded bg-gray-50 text-sm disabled:opacity-50" placeholder="Ej: 10045" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700">NOMBRE DE ARTÍCULO</label>
                  <input type="text" required value={indForm.name} onChange={e => setIndForm({...indForm, name: e.target.value})} className="w-full mt-1 p-2 border rounded bg-gray-50 text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700">CATEGORÍA</label>
                  <input type="text" required value={indForm.category} onChange={e => setIndForm({...indForm, category: e.target.value})} className="w-full mt-1 p-2 border rounded bg-gray-50 text-sm" />
                </div>
                
                <div className="sm:col-span-2 flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer font-bold text-orange-700 text-sm">
                    <input type="checkbox" checked={indForm.is_promo} onChange={e => setIndForm({...indForm, is_promo: e.target.checked})} className="form-checkbox h-4 w-4 text-orange-600 rounded" />
                    <span><Tag size={16} className="inline mr-1"/> Promo Activa</span>
                  </label>
                  {indForm.is_promo && (
                    <input type="number" required={indForm.is_promo} value={indForm.promo_price} onChange={e => setIndForm({...indForm, promo_price: Number(e.target.value)})} className="w-32 p-1 px-2 border rounded text-sm text-right" placeholder="Precio $" />
                  )}
                </div>

                <div className="sm:col-span-2 flex space-x-2 mt-2">
                  <button type="submit" className={`flex-1 text-white py-2 rounded-lg font-bold shadow-md transition ${isEditing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#003366] hover:bg-blue-800'}`}>
                    {isEditing ? 'Guardar Cambios' : 'Crear Artículo'}
                  </button>
                  {isEditing && (
                    <button type="button" onClick={() => { setIsEditing(false); setIndForm({ sku: '', name: '', category: '', is_active: true, is_promo: false, promo_price: 0 }); }} className="bg-gray-200 text-gray-700 px-4 rounded-lg font-bold hover:bg-gray-300 transition">
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* 📋 LISTA INTERACTIVA DE PRODUCTOS */}
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Catálogo General B2B ({adminList.length})</h3>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="px-6 py-3">SKU</th>
                    <th className="px-6 py-3">Artículo / Categoría</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                    <th className="px-6 py-3 text-center">Promo</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {adminList.map(p => (
                    <tr key={p.sku} className={`border-b hover:bg-gray-50 transition ${!p.is_active ? 'opacity-50 bg-gray-50' : ''}`}>
                      <td className="px-6 py-4 font-mono font-bold">{p.sku}</td>
                      <td className="px-6 py-4">
                        <p className={`font-bold ${!p.is_active ? 'line-through text-gray-400' : 'text-gray-900'}`}>{p.name}</p>
                        <p className="text-xs text-gray-400">{p.category}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {p.is_active ? 
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold flex items-center justify-center w-fit mx-auto"><Power size={12} className="mr-1"/> Activo</span> : 
                          <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-bold flex items-center justify-center w-fit mx-auto"><PowerOff size={12} className="mr-1"/> Inactivo</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-center">
                        {p.is_promo ? <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-bold">${Number(p.promo_price).toLocaleString('es-AR')}</span> : '-'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleEditClick(p)} title="Editar" className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 rounded"><Edit size={18}/></button>
                        <button onClick={() => handleToggleActive(p.sku, p.is_active)} title={p.is_active ? "Inactivar (Ocultar)" : "Reactivar"} className={`${p.is_active ? 'text-amber-500 bg-amber-50 hover:text-amber-700' : 'text-emerald-500 bg-emerald-50 hover:text-emerald-700'} p-1 rounded`}>
                          {p.is_active ? <PowerOff size={18}/> : <Power size={18}/>}
                        </button>
                        <button onClick={() => handleDelete(p.sku)} title="Eliminar Definitivo" className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {adminList.length === 0 && <p className="text-center py-10 text-gray-500">No hay productos en la base de datos.</p>}
            </div>
          </div>
        </div>
      )}

      {/* 👥 TAB 2: CLIENTES (AISLADO Y LIMPIO) */}
      {activeTab === 'clientes' && (
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 max-w-lg">
          <h3 className="text-lg font-bold mb-2 flex items-center"><Users className="mr-2 text-green-600" size={20}/> Alta Masiva de Clientes y Convenios (.xls)</h3>
          <p className="text-sm text-gray-500 mb-6">Sincronizá tus clientes del ERP para darles acceso instantáneo a su lista de precios asignada.</p>
          <input type="file" accept=".xls,.xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
          <button onClick={() => handleUpload('clientes')} disabled={loading || !file} className="mt-6 w-full bg-green-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 transition">
            {loading ? 'Sincronizando...' : 'Actualizar Base de Clientes'}
          </button>
        </div>
      )}

    </div>
  );
};