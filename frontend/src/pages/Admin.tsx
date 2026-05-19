import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Package, Users, ChevronDown, ChevronRight, Upload, Menu } from 'lucide-react';
import { api } from '../config/api';

// IMPORTAMOS LOS COMPONENTES MODULARIZADOS
import { ProductList } from '../components/admin/ProductList';
import { ClientForm } from '../components/admin/ClientForm';
import { ClientList } from '../components/admin/ClientList';

interface AdminProps {
  setSystemMessage: React.Dispatch<React.SetStateAction<string>>;
  triggerDataRefresh: () => Promise<void>;
}

// 🚀 COMPONENTE PARA ALTA DE USUARIOS/ADMINS
const UserForm = ({ setSystemMessage }: { setSystemMessage: any }) => {
  const [form, setForm] = useState({ email: '', password: '', role: 'Admin', convenio: 'GENERAL', telefono: '', domicilio_facturacion: '', vendedor: '', grupo: '' });
  return (
    <form className="bg-white p-6 rounded-2xl max-w-xl mx-auto space-y-4 shadow-sm border border-slate-200 mt-10" onSubmit={async e => { e.preventDefault(); try { await api.post('/auth/admin-create-user', form); setSystemMessage('✅ Usuario creado exitosamente'); setForm({ email: '', password: '', role: 'Admin', convenio: 'GENERAL', telefono: '', domicilio_facturacion: '', vendedor: '', grupo: '' }); } catch(e){ setSystemMessage('🚨 Error al crear usuario'); } }}>
      <h2 className="font-black text-xl mb-4 text-slate-900 uppercase">Alta de Usuario</h2>
      <div><label className="block text-xs font-black text-slate-700 uppercase mb-1">Email</label><input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" /></div>
      <div><label className="block text-xs font-black text-slate-700 uppercase mb-1">Contraseña</label><input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" /></div>
      <div><label className="block text-xs font-black text-slate-700 uppercase mb-1">Rol</label><select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"><option value="Admin">Administrador</option><option value="Minorista">Minorista</option></select></div>
      <button type="submit" className="w-full bg-slate-900 text-white p-3 rounded-xl font-bold hover:bg-slate-800 transition cursor-pointer">Crear Usuario</button>
    </form>
  );
};

export const Admin: React.FC<AdminProps> = ({ setSystemMessage, triggerDataRefresh }) => {
  const { user, logout } = useAuth(); 
  
  // Navigation & UI States (Agregado user-form)
  const [activeModule, setActiveModule] = useState<'product-list' | 'product-bulk' | 'client-list' | 'client-form' | 'client-bulk' | 'user-form' | 'preview'>('product-list');
  const [expandedSection, setExpandedSection] = useState<'products' | 'clients' | 'users' | null>('products');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Data States
  const [productList, setProductList] = useState<any[]>([]);
  const [clientList, setClientList] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Traer Productos para la tabla del admin
  const fetchAdminData = async () => {
    try {
      const response = await api.get(`/products/admin?t=${new Date().getTime()}`);
      setProductList(response.data);
    } catch (error) { 
      console.error('Error cargando productos en el admin:', error); 
    }
  };

  // Traer listado de clientes de la base de datos
  const fetchClientsData = async () => {
    try {
      const response = await api.get(`/auth/clients?t=${new Date().getTime()}`);
      setClientList(response.data);
    } catch (error) {
      console.error('Error cargando clientes en el admin:', error);
    }
  };

  useEffect(() => {
    if (activeModule === 'product-list') fetchAdminData();
    if (activeModule === 'client-list') fetchClientsData(); 
  }, [activeModule]);

  // Manejador de subidas masivas
  const handleBulkUpload = async (type: 'products' | 'clients') => {
    if (!file) return setSystemMessage('Seleccioná un archivo Excel o CSV.');
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
      } else {
        await fetchClientsData();
      }
    } catch (err) {
      setSystemMessage('Error procesando el archivo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'Admin') return null;

  return (
    <div className="flex h-full w-full bg-[#0f172a] overflow-hidden">
      
      {/* 🌑 SIDEBAR */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-[#020617] border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300`}>
        <div className="flex flex-col h-full">
          
          {/* TÍTULO PANEL */}
          <div className="h-20 flex items-center justify-between px-4 sm:px-6 border-b border-slate-800 shrink-0">
            {!isSidebarCollapsed ? (
              <h2 className="text-white text-sm font-black uppercase tracking-widest">PANEL ADMINISTRADOR</h2>
            ) : (
              <h2 className="text-white text-lg font-black mx-auto">PA</h2>
            )}
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-slate-400 hover:text-white p-1 ml-2 cursor-pointer">
              <Menu size={20} />
            </button>
          </div>
          
          <nav className="space-y-4 flex-1 overflow-y-auto p-4 sm:p-6">
            {/* PRODUCT MODULE */}
            <div>
              <button onClick={() => { if(isSidebarCollapsed) setIsSidebarCollapsed(false); setExpandedSection(expandedSection === 'products' ? null : 'products')}} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg transition cursor-pointer ${expandedSection === 'products' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>
                <div className="flex items-center"><Package size={20} className={!isSidebarCollapsed ? "mr-3" : ""} /> {!isSidebarCollapsed && <span className="text-sm font-bold">PRODUCTOS</span>}</div>
                {!isSidebarCollapsed && (expandedSection === 'products' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>)}
              </button>
              {expandedSection === 'products' && !isSidebarCollapsed && (
                <div className="ml-9 mt-2 space-y-1">
                  <button onClick={() => setActiveModule('product-list')} className={`w-full text-left p-2 text-xs font-medium rounded cursor-pointer ${activeModule === 'product-list' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Listado de Productos</button>
                  <button onClick={() => setActiveModule('product-bulk')} className={`w-full text-left p-2 text-xs font-medium rounded cursor-pointer ${activeModule === 'product-bulk' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Carga Masiva</button>
                </div>
              )}
            </div>

            {/* CLIENT MODULE */}
            <div>
              <button onClick={() => { if(isSidebarCollapsed) setIsSidebarCollapsed(false); setExpandedSection(expandedSection === 'clients' ? null : 'clients')}} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg transition cursor-pointer ${expandedSection === 'clients' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>
                <div className="flex items-center"><Users size={20} className={!isSidebarCollapsed ? "mr-3" : ""} /> {!isSidebarCollapsed && <span className="text-sm font-bold">CLIENTES</span>}</div>
                {!isSidebarCollapsed && (expandedSection === 'clients' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>)}
              </button>
              {expandedSection === 'clients' && !isSidebarCollapsed && (
                <div className="ml-9 mt-2 space-y-1">
                  <button onClick={() => setActiveModule('client-list')} className={`w-full text-left p-2 text-xs font-medium rounded cursor-pointer ${activeModule === 'client-list' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Gestión CRM</button>
                  <button onClick={() => setActiveModule('client-form')} className={`w-full text-left p-2 text-xs font-medium rounded cursor-pointer ${activeModule === 'client-form' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Alta Individual</button>
                  <button onClick={() => setActiveModule('client-bulk')} className={`w-full text-left p-2 text-xs font-medium rounded cursor-pointer ${activeModule === 'client-bulk' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Sincronizar ERP</button>
                </div>
              )}
            </div>

            {/* 🚀 USER MODULE (AGREGADO) */}
            <div>
              <button onClick={() => { if(isSidebarCollapsed) setIsSidebarCollapsed(false); setExpandedSection(expandedSection === 'users' ? null : 'users')}} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg transition cursor-pointer ${expandedSection === 'users' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>
                <div className="flex items-center"><UserIcon size={20} className={!isSidebarCollapsed ? "mr-3" : ""} /> {!isSidebarCollapsed && <span className="text-sm font-bold">USUARIOS</span>}</div>
                {!isSidebarCollapsed && (expandedSection === 'users' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>)}
              </button>
              {expandedSection === 'users' && !isSidebarCollapsed && (
                <div className="ml-9 mt-2 space-y-1">
                  <button onClick={() => setActiveModule('user-form')} className={`w-full text-left p-2 text-xs font-medium rounded cursor-pointer ${activeModule === 'user-form' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Crear Admin / Minorista</button>
                </div>
              )}
            </div>
          </nav>

          {/* FOOTER CON DATOS DE USUARIO Y LOGOUT */}
          <div className="p-4 border-t border-slate-800 shrink-0">
            {!isSidebarCollapsed && (
              <div className="flex items-center space-x-3 mb-4 px-2">
                <div className="bg-slate-800 p-2 rounded-full shrink-0">
                  <UserIcon size={18} className="text-blue-400" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">{user?.name || 'Usuario'}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate">
                    {user?.role === 'Admin' ? 'Administrador' : user?.role}
                  </p>
                </div>
              </div>
            )}
            
            <button 
              onClick={logout}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start px-4'} space-x-2 bg-red-900/20 hover:bg-red-900/50 text-red-400 hover:text-red-300 py-3 rounded-lg transition-colors border border-red-900/30 font-bold text-sm cursor-pointer`}
              title="Cerrar Sesión"
            >
              <LogOut size={18} className="shrink-0" />
              {!isSidebarCollapsed && <span>Cerrar Sesión</span>}
            </button>
          </div>

        </div>
      </aside>

      {/* 🖥️ MAIN WORKSPACE */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 sm:p-10">
        
        {/* RENDER LISTADO PRODUCTOS */}
        {activeModule === 'product-list' && (
          <ProductList products={productList} onRefresh={fetchAdminData} setSystemMessage={setSystemMessage} />
        )}

        {/* RENDER GESTIÓN CRM SEPARADO */}
        {activeModule === 'client-list' && (
          <ClientList clientList={clientList} setClientList={setClientList} setSystemMessage={setSystemMessage} />
        )}

        {activeModule === 'client-form' && (
          <ClientForm setSystemMessage={setSystemMessage} />
        )}

        {/* 🚀 RENDER DE CREACIÓN DE USUARIO (AGREGADO) */}
        {activeModule === 'user-form' && (
          <UserForm setSystemMessage={setSystemMessage} />
        )}

        {/* PRODUCT BULK UPLOAD */}
        {activeModule === 'product-bulk' && (
          <div className="max-w-xl mx-auto space-y-6 mt-10 text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto"><Upload className="text-blue-600" size={28} /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">Carga Masiva de Productos</h2>
              <p className="text-slate-400 text-xs mt-1">Sincronizá tu Excel de inventario y listas.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200">
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" id="prod-file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <label htmlFor="prod-file" className="cursor-pointer block text-sm text-slate-500 font-medium py-4">{file ? `Seleccionado: ${file.name}` : "Hacé click para seleccionar matriz Excel"}</label>
              <button onClick={() => handleBulkUpload('products')} disabled={isLoading || !file} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50 text-sm cursor-pointer">
                {isLoading ? "Procesando matriz..." : "Actualizar Catálogo B2B"}
              </button>
            </div>
          </div>
        )}

        {/* 🚀 CLIENT BULK UPLOAD (AGREGADO) */}
        {activeModule === 'client-bulk' && (
          <div className="max-w-xl mx-auto space-y-6 mt-10 text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto"><Upload className="text-blue-600" size={28} /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">Carga Masiva de Clientes</h2>
              <p className="text-slate-400 text-xs mt-1">Sincronizá tu listado de clientes mediante Excel/CSV.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200">
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" id="client-file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <label htmlFor="client-file" className="cursor-pointer block text-sm text-slate-500 font-medium py-4">{file ? `Seleccionado: ${file.name}` : "Hacé click para seleccionar matriz CSV/Excel"}</label>
              <button onClick={() => handleBulkUpload('clients')} disabled={isLoading || !file} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50 text-sm cursor-pointer">
                {isLoading ? "Procesando matriz..." : "Sincronizar Clientes"}
              </button>
            </div>
          </div>
        )}
      </main>

    </div>
  );
};