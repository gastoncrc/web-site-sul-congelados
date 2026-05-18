import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Package, Users, ChevronDown, ChevronRight, Search, 
  Plus, Upload, Edit, Trash2, Power, PowerOff, LayoutDashboard, Eye
} from 'lucide-react';
import { api } from '../config/api';

interface AdminProps {
  setStatusMessage: React.Dispatch<React.SetStateAction<string>>;
  triggerRefresh: () => Promise<void>;
}

export const Admin: React.FC<AdminProps> = ({ setStatusMessage, triggerRefresh }) => {
  const { user } = useAuth();
  
  // Estado de navegación
  const [activeView, setActiveView] = useState<'prod-list' | 'prod-bulk' | 'cli-list' | 'cli-bulk' | 'preview'>('prod-list');
  const [expandedMenu, setExpandedMenu] = useState<'productos' | 'clientes' | null>('productos');

  // Estados de datos
  const [adminList, setAdminList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carga de archivos
  const [file, setFile] = useState<File | null>(null);

  const fetchAdminProducts = async () => {
    try {
      const res = await api.get('/products/admin');
      setAdminList(res.data);
    } catch (err) {
      console.error("Error cargando tabla admin", err);
    }
  };

  useEffect(() => {
    if (activeView === 'prod-list') fetchAdminProducts();
  }, [activeView]);

  if (user?.role !== 'Admin') return <div className="p-10 text-red-500 font-bold">Acceso Denegado</div>;

  // Filtrado dinámico
  const filteredProducts = adminList.filter(p => {
    const matchesSearch = p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = showInactive ? true : p.is_active;
    return matchesSearch && matchesStatus;
  });

  const handleUpload = async (type: 'productos' | 'clientes') => {
    if (!file) return setStatusMessage('Seleccioná un archivo');
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const endpoint = type === 'productos' ? '/products/upload-prices' : '/auth/upload-clients';
      await api.post(endpoint, formData);
      setStatusMessage('Sincronización exitosa');
      setFile(null);
      await fetchAdminProducts();
    } catch (err) {
      setStatusMessage('Error en la carga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] -m-4 sm:-m-6 bg-[#0f172a] overflow-hidden">
      
      {/* 🌑 SIDEBAR IZQUIERDO */}
      <aside className="w-64 bg-[#020617] border-r border-slate-800 flex flex-col">
        <div className="p-6">
          <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Administración SUL</h2>
          
          <nav className="space-y-2">
            
            {/* ITEM: PRODUCTOS */}
            <div>
              <button 
                onClick={() => setExpandedMenu(expandedMenu === 'productos' ? null : 'productos')}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition ${expandedMenu === 'productos' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}
              >
                <div className="flex items-center"><Package size={18} className="mr-3" /> <span className="text-sm font-bold">PRODUCTOS</span></div>
                {expandedMenu === 'productos' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
              </button>
              
              {expandedMenu === 'productos' && (
                <div className="ml-9 mt-2 space-y-1">
                  <button onClick={() => setActiveView('prod-list')} className={`w-full text-left p-2 text-xs font-medium rounded ${activeView === 'prod-list' ? 'text-[#deff9a]' : 'text-slate-500 hover:text-white'}`}>Listado CRUD</button>
                  <button onClick={() => setActiveView('prod-bulk')} className={`w-full text-left p-2 text-xs font-medium rounded ${activeView === 'prod-bulk' ? 'text-[#deff9a]' : 'text-slate-500 hover:text-white'}`}>Carga Masiva</button>
                </div>
              )}
            </div>

            {/* ITEM: CLIENTES */}
            <div>
  <button 
    onClick={() => setExpandedMenu(expandedMenu === 'clientes' ? null : 'clientes')}
    className={`w-full flex items-center justify-between p-3 rounded-lg transition ${expandedMenu === 'clientes' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}
  >
    <div className="flex items-center"><Users size={18} className="mr-3" /> <span className="text-sm font-bold">CLIENTES</span></div>
    {expandedMenu === 'clientes' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
  </button>
  
  {expandedMenu === 'clientes' && (
    <div className="ml-9 mt-2 space-y-1">
      {/* ✅ CORREGIDO: Ahora si el ítem está activo se pinta con tu verde claro, y si no, queda gris */}
      <button 
        onClick={() => setActiveView('cli-list')} 
        className={`w-full text-left p-2 text-xs font-medium rounded ${activeView === 'cli-list' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}
      >
        Gestión CRM
      </button>
      
      <button 
        onClick={() => setActiveView('cli-bulk')} 
        className={`w-full text-left p-2 text-xs font-medium rounded ${activeView === 'cli-bulk' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}
      >
        Sincronizar ERP
      </button>
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

      {/* 🖥️ ÁREA DE TRABAJO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        
        {/* VISTA: LISTADO PRODUCTOS */}
        {activeView === 'prod-list' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-2xl font-black text-slate-900 uppercase">Gestión de Artículos</h1>
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 w-full sm:w-96 shadow-sm">
                <Search size={18} className="text-slate-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Buscar por SKU o Nombre..." 
                  className="bg-transparent border-none focus:ring-0 text-sm w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showInactive} 
                    onChange={e => setShowInactive(e.target.checked)} 
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" 
                  />
                  <span className="text-xs font-bold text-slate-600 uppercase">Mostrar Inactivos</span>
                </label>
                <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center hover:bg-slate-800 transition">
                  <Plus size={14} className="mr-2"/> NUEVO ARTÍCULO
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">SKU</th>
                      <th className="px-6 py-4">Artículo</th>
                      <th className="px-6 py-4">Categoría</th>
                      <th className="px-6 py-4 text-center">Estado</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map(p => (
                      <tr key={p.sku} className={`hover:bg-slate-50 transition ${!p.is_active ? 'bg-slate-50/50' : ''}`}>
                        <td className="px-6 py-4 font-mono font-bold text-slate-400">{p.sku}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                        <td className="px-6 py-4 text-slate-500">{p.category}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {p.is_active ? 
                              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-black flex items-center"><Power size={10} className="mr-1"/> ACTIVO</span> : 
                              <span className="bg-slate-200 text-slate-500 px-2 py-1 rounded-md text-[10px] font-black flex items-center"><PowerOff size={10} className="mr-1"/> PAUSADO</span>
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition"><Edit size={16}/></button>
                          <button className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VISTA: CARGA MASIVA */}
        {activeView === 'prod-bulk' && (
          <div className="max-w-2xl mx-auto space-y-8 mt-10">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="text-blue-600" size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase">Sincronización Masiva</h2>
              <p className="text-slate-500 text-sm mt-2">Cargá tu matriz de precios y convenios desde Excel.</p>
            </div>
            
            <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-6">
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                className="hidden" 
                id="bulk-upload" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="bulk-upload" className="cursor-pointer block">
                <div className="text-slate-400 text-sm">{file ? `Archivo: ${file.name}` : "Arrastrá tu archivo aquí o hacé click para buscar"}</div>
              </label>
              <button 
                onClick={() => handleUpload('productos')}
                disabled={loading || !file}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition disabled:opacity-50"
              >
                {loading ? "Procesando Datos..." : "Iniciar Carga en Base Central"}
              </button>
            </div>
          </div>
        )}

        {/* MODO PREVIEW CLIENTE */}
        {activeView === 'preview' && (
          <div className="bg-amber-50 border-2 border-dashed border-amber-200 rounded-3xl p-20 text-center">
            <h2 className="text-amber-800 font-black text-xl uppercase">Modo Vista Previa</h2>
            <p className="text-amber-600 mt-2">Aquí se cargaría el componente de Catálogo para ver cómo lo ve el cliente.</p>
            <button onClick={() => setActiveView('prod-list')} className="mt-6 bg-amber-800 text-white px-6 py-2 rounded-full text-xs font-bold">VOLVER AL PANEL</button>
          </div>
        )}

      </main>
    </div>
  );
};