import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Package, Users, ChevronDown, ChevronRight, Search, 
  Plus, Upload, Edit, Trash2, Power, PowerOff, Eye, ArrowLeft, Tag
} from 'lucide-react';
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
  
  // Estado de navegación del Sidebar
  const [activeView, setActiveView] = useState<'prod-list' | 'prod-form' | 'prod-bulk' | 'cli-list' | 'cli-bulk' | 'preview'>('prod-list');
  const [expandedMenu, setExpandedMenu] = useState<'productos' | 'clientes' | null>('productos');

  // Estados de datos
  const [adminList, setAdminList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Carga de archivos Excel
  const [file, setFile] = useState<File | null>(null);

  // Formulario de Producto Individual
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

  useEffect(() => {
    if (activeView === 'prod-list') fetchAdminProducts();
  }, [activeView]);

  if (user?.role !== 'Admin') return <div className="p-10 text-red-500 font-bold">Acceso Denegado</div>;

  // Filtrado dinámico de la tabla (Buscador Inteligente)
  const filteredProducts = adminList.filter(p => {
    const matchesSearch = p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = showInactive ? true : p.is_active;
    return matchesSearch && matchesStatus;
  });

  // --- CONTROLES CRUD ---
  const handleOpenCreate = () => {
    setIsEditing(false);
    setIndForm({ sku: '', name: '', category: '', is_active: true, is_promo: false, promo_price: 0 });
    setActiveView('prod-form');
  };

  const handleOpenEdit = (product: any) => {
    setIsEditing(true);
    setIndForm({
      sku: product.sku,
      name: product.name,
      category: product.category,
      is_active: product.is_active,
      is_promo: product.is_promo,
      promo_price: product.promo_price ? Number(product.promo_price) : 0
    });
    setActiveView('prod-form');
  };

  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products/individual', indForm);
      setStatusMessage(isEditing ? '¡Producto actualizado con éxito!' : '¡Producto creado con éxito!');
      setActiveView('prod-list');
      await fetchAdminProducts();
      await triggerRefresh();
    } catch (err) {
      setStatusMessage('Error al guardar el producto.');
    }
  };

  const handleToggleActive = async (sku: string, currentStatus: boolean) => {
    try {
      await api.patch(`/products/${sku}/flags`, { is_active: !currentStatus });
      setStatusMessage(!currentStatus ? 'Producto Reactivado' : 'Producto Pausado (Oculto del catálogo)');
      await fetchAdminProducts();
      await triggerRefresh();
    } catch (err) {
      setStatusMessage('Error al cambiar el estado del producto.');
    }
  };

  const handleDelete = async (sku: string) => {
    if (!window.confirm(`¿Estás completamente seguro de ELIMINAR el SKU ${sku}? Esta acción borrará también sus precios relacionales.`)) return;
    try {
      await api.delete(`/products/${sku}`);
      setStatusMessage('Producto eliminado definitivamente del ecosistema.');
      await fetchAdminProducts();
      await triggerRefresh();
    } catch (err) {
      setStatusMessage('Error al intentar eliminar el producto.');
    }
  };

  const handleUpload = async (type: 'productos' | 'clientes') => {
    if (!file) return setStatusMessage('Por favor, seleccioná un archivo válido.');
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
      setStatusMessage('Error en el procesamiento del Excel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] -m-4 sm:-m-6 bg-[#0f172a] overflow-hidden">
      
      {/* 🌑 SIDEBAR IZQUIERDO MENÚ ACCORDION */}
      <aside className="w-64 bg-[#020617] border-r border-slate-800 flex flex-col flex-shrink-0">
        <div className="p-6">
          <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Consola Logística</h2>
          
          <nav className="space-y-2">
            {/* GRUPO: PRODUCTOS */}
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
                  <button onClick={() => setActiveView('prod-list')} className={`w-full text-left p-2 text-xs font-medium rounded ${activeView === 'prod-list' || activeView === 'prod-form' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Listado CRUD</button>
                  <button onClick={() => setActiveView('prod-bulk')} className={`w-full text-left p-2 text-xs font-medium rounded ${activeView === 'prod-bulk' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Carga Masiva</button>
                </div>
              )}
            </div>

            {/* GRUPO: CLIENTES */}
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

      {/* 🖥️ ÁREA DE CONTROL PRINCIPAL */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        
        {/* SUB-VISTA: TABLA CRUD PRODUCTOS */}
        {activeView === 'prod-list' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-2xl font-black text-slate-900 uppercase">Artículos en Base</h1>
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
                  <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded border-slate-300 text-slate-950 focus:ring-slate-950" />
                  <span className="text-xs font-bold text-slate-600 uppercase">Ver Inactivos</span>
                </label>
                <button onClick={handleOpenCreate} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center hover:bg-slate-800 transition shadow">
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
                      <tr key={p.sku} className={`hover:bg-slate-50/80 transition ${!p.is_active ? 'bg-slate-100/50 opacity-60' : ''}`}>
                        <td className="px-6 py-4 font-mono font-bold text-slate-400">{p.sku}</td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${!p.is_active ? 'line-through text-slate-400' : 'text-slate-900'}`}>{p.name}</span>
                          {p.is_promo && <span className="ml-2 bg-orange-100 text-orange-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Promo</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{p.category}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {p.is_active ? 
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-black flex items-center"><Power size={10} className="mr-1"/> ACTIVO</span> : 
                              <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-black flex items-center"><PowerOff size={10} className="mr-1"/> PAUSADO</span>
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1">
                          <button onClick={() => handleOpenEdit(p)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"><Edit size={16}/></button>
                          <button onClick={() => handleToggleActive(p.sku, p.is_active)} className={`${p.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'} p-2 rounded-lg transition`}>{p.is_active ? <PowerOff size={16}/> : <Power size={16}/>}</button>
                          <button onClick={() => handleDelete(p.sku)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUB-VISTA: FORMULARIO INDIVIDUAL (CREAR / EDITAR) */}
        {activeView === 'prod-form' && (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mt-4">
            <button onClick={() => setActiveView('prod-list')} className="text-slate-500 hover:text-slate-900 text-xs font-bold flex items-center mb-6"><ArrowLeft size={14} className="mr-1"/> VOLVER AL LISTADO</button>
            <h2 className="text-xl font-black text-slate-900 uppercase mb-6">{isEditing ? `Editar Artículo: ${indForm.sku}` : 'Crear Nuevo Artículo B2B'}</h2>
            
            <form onSubmit={handleIndividualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase">SKU / Código Único</label>
                <input type="text" required disabled={isEditing} value={indForm.sku} onChange={e => setIndForm({...indForm, sku: e.target.value})} className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase">Nombre Comercial del Producto</label>
                <input type="text" required value={indForm.name} onChange={e => setIndForm({...indForm, name: e.target.value})} className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase">Rubro / Categoría</label>
                <input type="text" required value={indForm.category} onChange={e => setIndForm({...indForm, category: e.target.value})} className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-sm" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl mt-4">
                <label className="flex items-center space-x-2 cursor-pointer font-black text-orange-800 text-xs uppercase">
                  <input type="checkbox" checked={indForm.is_promo} onChange={e => setIndForm({...indForm, is_promo: e.target.checked})} className="form-checkbox h-4 w-4 text-orange-600 rounded" />
                  <span><Tag size={14} className="inline mr-1"/> Destacar en Carrusel de Promos</span>
                </label>
                {indForm.is_promo && (
                  <input type="number" required={indForm.is_promo} value={indForm.promo_price} onChange={e => setIndForm({...indForm, promo_price: Number(e.target.value)})} className="w-32 p-2 border border-orange-300 rounded-xl text-sm text-right font-bold" placeholder="Precio Promo" />
                )}
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow mt-4 text-sm">{isEditing ? 'Guardar Cambios' : 'Insertar Producto'}</button>
            </form>
          </div>
        )}

        {/* SUB-VISTA: MASIVO PRODUCTOS */}
        {activeView === 'prod-bulk' && (
          <div className="max-w-xl mx-auto space-y-6 mt-10 text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto"><Upload className="text-blue-600" size={28} /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">Inyección de Listas Globales</h2>
              <p className="text-slate-400 text-xs mt-1">Cargá el archivo relacional de convenios comerciales.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200 space-y-4">
              <input type="file" accept=".xlsx,.xls" className="hidden" id="prod-file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <label htmlFor="prod-file" className="cursor-pointer block text-sm text-slate-500 font-medium py-4">{file ? `Seleccionado: ${file.name}` : "Hacé click para seleccionar matriz Excel"}</label>
              <button onClick={() => handleUpload('productos')} disabled={loading || !file} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50 text-sm">{loading ? "Procesando matriz..." : "Actualizar Catálogo Global"}</button>
            </div>
          </div>
        )}

        {/* SUB-VISTA: CLIENTES LISTADO (CRM) */}
        {activeView === 'cli-list' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-slate-900 uppercase">Ecosistema de Clientes B2B</h1>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
              <p className="text-slate-500 text-sm">Módulo centralizado de Clientes. Aquí mapearás el listado central de franquicias, sus credenciales y el cambio de contraseñas obligatorias.</p>
            </div>
          </div>
        )}

        {/* SUB-VISTA: CLIENTES MASIVO */}
        {activeView === 'cli-bulk' && (
          <div className="max-w-xl mx-auto space-y-6 mt-10 text-center">
            <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto"><Users className="text-emerald-600" size={28} /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">Sincronización Logística de Clientes</h2>
              <p className="text-slate-400 text-xs mt-1">Sincronizá el padrón de sucursales desde tu base central.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200 space-y-4">
              <input type="file" accept=".xlsx,.xls" className="hidden" id="cli-file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <label htmlFor="cli-file" className="cursor-pointer block text-sm text-slate-500 font-medium py-4">{file ? `Seleccionado: ${file.name}` : "Hacé click para seleccionar padrón de clientes"}</label>
              <button onClick={() => handleUpload('clientes')} disabled={loading || !file} className="w-full bg-emerald-700 text-white py-3 rounded-xl font-bold hover:bg-emerald-800 transition disabled:opacity-50 text-sm">{loading ? "Sincronizando cuentas..." : "Actualizar Padrón de Sucursales"}</button>
            </div>
          </div>
        )}

        {/* SUB-VISTA: PREVIEW CLIENTE */}
        {activeView === 'preview' && (
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-12 text-center max-w-2xl mx-auto mt-6">
            <h2 className="text-sky-900 font-black text-lg uppercase mb-2">Entorno de Simulación</h2>
            <p className="text-slate-500 text-xs max-w-md mx-auto mb-6">Esta vista te servirá más adelante para incrustar el catálogo real de compras y probar cómo se renderizan los precios convenio sin salir del perfil administrador.</p>
            <button onClick={() => setActiveView('prod-list')} className="bg-sky-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow hover:bg-sky-950 transition">Regresar a la Consola</button>
          </div>
        )}

      </main>
    </div>
  );
};