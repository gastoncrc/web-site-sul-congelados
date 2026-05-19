import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package, Users, ChevronDown, ChevronRight, Upload, Menu } from 'lucide-react';
import { api } from '../config/api';

// 🚀 IMPORTAMOS LOS COMPONENTES CREADOS RECIÉN
import { ProductList } from '../components/admin/ProductList';
import { ClientForm } from '../components/admin/ClientForm';

interface AdminProps {
  setSystemMessage: React.Dispatch<React.SetStateAction<string>>;
  triggerDataRefresh: () => Promise<void>;
}

export const Admin: React.FC<AdminProps> = ({ setSystemMessage, triggerDataRefresh }) => {
  const { user } = useAuth();
  
  // Navigation & UI States
  const [activeModule, setActiveModule] = useState<'product-list' | 'product-bulk' | 'client-list' | 'client-form' | 'client-bulk' | 'preview'>('product-list');
  const [expandedSection, setExpandedSection] = useState<'products' | 'clients' | null>('products');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Data States
  const [productList, setProductList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const fetchAdminData = async () => {
    try {
      const response = await api.get('/products/admin');
      setProductList(response.data);
    } catch (error) { 
      console.error(error); 
    }
  };

  useEffect(() => {
    if (activeModule === 'product-list') fetchAdminData();
  }, [activeModule]);

  if (user?.role !== 'Admin') return null;

  const handleBulkUpload = async (type: 'products' | 'clients') => {
    if (!file) return setSystemMessage('Seleccioná un archivo Excel.');
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const endpoint = type === 'products' ? '/products/upload-prices' : '/auth/upload-clients';
      const response = await api.post(endpoint, formData);
      setSystemMessage(response.data.message);
      setFile(null);
      if (type === 'products') {
        await fetchAdminData();
        await triggerDataRefresh();
      }
    } catch (err) {
      setSystemMessage('Error procesando el archivo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#0f172a] overflow-hidden">
      
      {/* 🌑 SIDEBAR */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-[#020617] border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300`}>
        <div className="p-4 sm:p-6 flex flex-col h-full">
          
          <div className="flex items-center justify-between mb-8">
            {!isSidebarCollapsed && <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Consola B2B</h2>}
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-slate-400 hover:text-white p-1">
              <Menu size={20} />
            </button>
          </div>
          
          <nav className="space-y-4 flex-1">
            {/* PRODUCT MODULE */}
            <div>
              <button onClick={() => { if(isSidebarCollapsed) setIsSidebarCollapsed(false); setExpandedSection(expandedSection === 'products' ? null : 'products')}} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg transition ${expandedSection === 'products' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>
                <div className="flex items-center"><Package size={20} className={!isSidebarCollapsed ? "mr-3" : ""} /> {!isSidebarCollapsed && <span className="text-sm font-bold">PRODUCTOS</span>}</div>
                {!isSidebarCollapsed && (expandedSection === 'products' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>)}
              </button>
              {expandedSection === 'products' && !isSidebarCollapsed && (
                <div className="ml-9 mt-2 space-y-1">
                  <button onClick={() => setActiveModule('product-list')} className={`w-full text-left p-2 text-xs font-medium rounded ${activeModule === 'product-list' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Listado de Productos</button>
                  <button onClick={() => setActiveModule('product-bulk')} className={`w-full text-left p-2 text-xs font-medium rounded ${activeModule === 'product-bulk' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Carga Masiva</button>
                </div>
              )}
            </div>

            {/* CLIENT MODULE */}
            <div>
              <button onClick={() => { if(isSidebarCollapsed) setIsSidebarCollapsed(false); setExpandedSection(expandedSection === 'clients' ? null : 'clients')}} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg transition ${expandedSection === 'clients' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>
                <div className="flex items-center"><Users size={20} className={!isSidebarCollapsed ? "mr-3" : ""} /> {!isSidebarCollapsed && <span className="text-sm font-bold">CLIENTES</span>}</div>
                {!isSidebarCollapsed && (expandedSection === 'clients' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>)}
              </button>
              {expandedSection === 'clients' && !isSidebarCollapsed && (
                <div className="ml-9 mt-2 space-y-1">
                  <button onClick={() => setActiveModule('client-list')} className={`w-full text-left p-2 text-xs font-medium rounded ${activeModule === 'client-list' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Gestión CRM</button>
                  <button onClick={() => setActiveModule('client-form')} className={`w-full text-left p-2 text-xs font-medium rounded ${activeModule === 'client-form' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Alta Individual</button>
                  <button onClick={() => setActiveModule('client-bulk')} className={`w-full text-left p-2 text-xs font-medium rounded ${activeModule === 'client-bulk' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Sincronizar ERP</button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </aside>

      {/* 🖥️ MAIN WORKSPACE */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 sm:p-10">
        
        {/* 🚀 RENDER DE COMPONENTES */}
        {activeModule === 'product-list' && (
          <ProductList products={productList} onRefresh={fetchAdminData} setSystemMessage={setSystemMessage} />
        )}

        {activeModule === 'client-form' && (
          <ClientForm setSystemMessage={setSystemMessage} />
        )}

        {/* 🚀 PRODUCT BULK UPLOAD */}
        {activeModule === 'product-bulk' && (
          <div className="max-w-xl mx-auto space-y-6 mt-10 text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto"><Upload className="text-blue-600" size={28} /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">Carga Masiva de Productos</h2>
              <p className="text-slate-400 text-xs mt-1">Sincronizá tu Excel de inventario y listas.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200">
              <input type="file" accept=".xlsx,.xls" className="hidden" id="prod-file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <label htmlFor="prod-file" className="cursor-pointer block text-sm text-slate-500 font-medium py-4">{file ? `Seleccionado: ${file.name}` : "Hacé click para seleccionar matriz Excel"}</label>
              <button onClick={() => handleBulkUpload('products')} disabled={isLoading || !file} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50 text-sm">
                {isLoading ? "Procesando matriz..." : "Actualizar Catálogo B2B"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};