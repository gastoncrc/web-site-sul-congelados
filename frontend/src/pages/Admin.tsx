import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package, Users, ChevronDown, ChevronRight, Upload, Eye } from 'lucide-react';
import { api } from '../config/api';

// Componentes modulares
import { ProductList } from '../components/admin/ProductList';
import { ProductForm } from '../components/admin/ProductForm';

interface AdminProps {
  setStatusMessage: React.Dispatch<React.SetStateAction<string>>;
  triggerRefresh: () => Promise<void>;
}

export const Admin: React.FC<AdminProps> = ({ setStatusMessage, triggerRefresh }) => {
  const { user } = useAuth();
  
  const [activeView, setActiveView] = useState<'prod-list' | 'prod-form' | 'prod-bulk' | 'cli-list' | 'cli-bulk' | 'preview'>('prod-list');
  const [expandedMenu, setExpandedMenu] = useState<'productos' | 'clientes' | null>('productos');
  
  const [adminList, setAdminList] = useState<any[]>([]);
  const [productToEdit, setProductToEdit] = useState<any>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAdminProducts = async () => {
    try {
      const res = await api.get('/products/admin');
      setAdminList(res.data);
    } catch (err) {
      console.error("Error", err);
    }
  };

  useEffect(() => {
    if (activeView === 'prod-list') fetchAdminProducts();
  }, [activeView]);

  if (user?.role !== 'Admin') return <div className="p-10 text-red-500 font-bold">Acceso Denegado</div>;

  const handleOpenEdit = (product: any) => {
    setProductToEdit(product);
    setActiveView('prod-form');
  };

  const handleOpenCreate = () => {
    setProductToEdit(null);
    setActiveView('prod-form');
  };

  const handleFormSuccess = async () => {
    setActiveView('prod-list');
    await fetchAdminProducts();
    await triggerRefresh();
  };

  const handleUpload = async (type: 'productos' | 'clientes') => {
    if (!file) return setStatusMessage('Seleccioná un archivo.');
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
    } catch (err) {
      setStatusMessage('Error en el Excel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] -m-4 sm:-m-6 bg-[#0f172a] overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#020617] border-r border-slate-800 flex flex-col flex-shrink-0">
        <div className="p-6">
          <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Consola Logística</h2>
          <nav className="space-y-2">
            
            {/* MENU PRODUCTOS */}
            <div>
              <button onClick={() => setExpandedMenu(expandedMenu === 'productos' ? null : 'productos')} className={`w-full flex items-center justify-between p-3 rounded-lg transition ${expandedMenu === 'productos' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>
                <div className="flex items-center"><Package size={18} className="mr-3" /> <span className="text-sm font-bold">PRODUCTOS</span></div>
                {expandedMenu === 'productos' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
              </button>
              {expandedMenu === 'productos' && (
                <div className="ml-9 mt-2 space-y-1">
                  <button onClick={() => setActiveView('prod-list')} className={`w-full text-left p-2 text-xs font-medium rounded ${activeView === 'prod-list' || activeView === 'prod-form' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Listado CRUD</button>
                  <button onClick={() => setActiveView('prod-bulk')} className={`w-full text-left p-2 text-xs font-medium rounded ${activeView === 'prod-bulk' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Carga Masiva</button>
                </div>
              )}
            </div>

            {/* MENU CLIENTES */}
            <div>
              <button onClick={() => setExpandedMenu(expandedMenu === 'clientes' ? null : 'clientes')} className={`w-full flex items-center justify-between p-3 rounded-lg transition ${expandedMenu === 'clientes' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>
                <div className="flex items-center"><Users size={18} className="mr-3" /> <span className="text-sm font-bold">CLIENTES</span></div>
                {expandedMenu === 'clientes' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
              </button>
              {expandedMenu === 'clientes' && (
                <div className="ml-9 mt-2 space-y-1">
                  <button onClick={() => setActiveView('cli-list')} className={`w-full text-left p-2 text-xs font-medium rounded ${activeView === 'cli-list' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Gestión CRM</button>
                  <button onClick={() => setActiveView('cli-bulk')} className={`w-full text-left p-2 text-xs font-medium rounded ${activeView === 'cli-bulk' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Sincronizar ERP</button>
                </div>
              )}
            </div>

            <hr className="border-slate-800 my-4" />
            <button onClick={() => setActiveView('preview')} className="w-full flex items-center p-3 text-slate-400 hover:bg-slate-900 rounded-lg transition">
              <Eye size={18} className="mr-3" /> <span className="text-sm font-bold text-sky-400">VISTA PREVIA</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DINÁMICA */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        
        {/* RENDERIZADO MODULAR */}
        {activeView === 'prod-list' && (
          <ProductList 
            products={adminList} 
            onEdit={handleOpenEdit} 
            onRefresh={fetchAdminProducts} 
            setStatusMessage={setStatusMessage}
            onCreateNew={handleOpenCreate} 
          />
        )}
        
        {activeView === 'prod-form' && (
          <ProductForm 
            initialData={productToEdit} 
            onSuccess={handleFormSuccess} 
            onCancel={() => setActiveView('prod-list')} 
            setStatusMessage={setStatusMessage} 
          />
        )}

        {/* VISTAS SIMPLES INLINE (Puedes extraerlas después si crecen) */}
        {activeView === 'prod-bulk' && (
          <div className="max-w-xl mx-auto space-y-6 mt-10 text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto"><Upload className="text-blue-600" size={28} /></div>
            <div><h2 className="text-xl font-black text-slate-900 uppercase">Inyección de Listas</h2></div>
            <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200">
              <input type="file" accept=".xlsx,.xls" className="hidden" id="prod-file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <label htmlFor="prod-file" className="cursor-pointer block text-sm text-slate-500 font-medium py-4">{file ? `Archivo: ${file.name}` : "Seleccionar matriz Excel"}</label>
              <button onClick={() => handleUpload('productos')} disabled={loading || !file} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold disabled:opacity-50 text-sm">Actualizar Base</button>
            </div>
          </div>
        )}

        {activeView === 'cli-list' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
            <p className="text-slate-500 text-sm">Módulo CRM en construcción. Aquí verás el listado de franquicias.</p>
          </div>
        )}

        {activeView === 'cli-bulk' && (
          <div className="max-w-xl mx-auto space-y-6 mt-10 text-center">
            <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto"><Users className="text-emerald-600" size={28} /></div>
            <div><h2 className="text-xl font-black text-slate-900 uppercase">Sincronización de Clientes</h2></div>
            <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200">
              <input type="file" accept=".xlsx,.xls" className="hidden" id="cli-file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <label htmlFor="cli-file" className="cursor-pointer block text-sm text-slate-500 font-medium py-4">{file ? `Archivo: ${file.name}` : "Seleccionar padrón de clientes"}</label>
              <button onClick={() => handleUpload('clientes')} disabled={loading || !file} className="w-full bg-emerald-700 text-white py-3 rounded-xl font-bold disabled:opacity-50 text-sm">Actualizar Padrón</button>
            </div>
          </div>
        )}

        {activeView === 'preview' && (
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-12 text-center max-w-2xl mx-auto mt-6">
            <h2 className="text-sky-900 font-black text-lg uppercase mb-2">Entorno de Simulación</h2>
            <button onClick={() => setActiveView('prod-list')} className="mt-6 bg-sky-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold">Regresar</button>
          </div>
        )}

      </main>
    </div>
  );
};