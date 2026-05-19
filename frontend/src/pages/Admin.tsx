import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Package, Users, ChevronDown, ChevronRight, Upload, Menu } from 'lucide-react';
import { api } from '../config/api';

// IMPORTAMOS LOS COMPONENTES CREADOS
import { ProductList } from '../components/admin/ProductList';
import { ClientForm } from '../components/admin/ClientForm';

interface AdminProps {
  setSystemMessage: React.Dispatch<React.SetStateAction<string>>;
  triggerDataRefresh: () => Promise<void>;
}

export const Admin: React.FC<AdminProps> = ({ setSystemMessage, triggerDataRefresh }) => {
  const { user, logout } = useAuth(); 
  
  // Navigation & UI States
  const [activeModule, setActiveModule] = useState<'product-list' | 'product-bulk' | 'client-list' | 'client-form' | 'client-bulk' | 'preview'>('product-list');
  const [expandedSection, setExpandedSection] = useState<'products' | 'clients' | null>('products');
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
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-slate-400 hover:text-white p-1 ml-2">
              <Menu size={20} />
            </button>
          </div>
          
          <nav className="space-y-4 flex-1 overflow-y-auto p-4 sm:p-6">
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

        {/* 🚀 RENDER GESTIÓN CRM (CON INTEGRACIÓN DE BAJA LÓGICA) */}
        {activeModule === 'client-list' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-black text-slate-900 uppercase mb-6 flex items-center">
              <Users className="mr-2 text-slate-400"/> Gestión CRM - Clientes Registrados
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black text-slate-500 uppercase">
                    <th className="p-3">Nombre Comercial / Razón Social</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Convenio</th>
                    <th className="p-3">Localidad</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {clientList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                        No hay clientes registrados en el sistema o la base de datos está vacía.
                      </td>
                    </tr>
                  ) : (
                    clientList.map((client) => (
                      <tr key={client.id} className={`hover:bg-slate-50 transition-colors ${!client.is_active ? 'bg-slate-50/50 opacity-60' : ''}`}>
                        <td className="p-3">
                          <span className="font-bold text-slate-950 block">{client.name}</span>
                          <span className="text-xs text-slate-400 font-medium">{client.razon_social || '-'}</span>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{client.email}</td>
                        <td className="p-3">
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider border border-blue-100">
                            {client.convenio || 'GENERAL'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">
                          {client.localidad || '-'}{client.provincia ? `, ${client.provincia}` : ''}
                        </td>
                        <td className="p-3">
                          {client.is_active !== false ? (
                            <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase">
                              Activo
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase">
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {client.is_active !== false ? (
                            <button 
                              onClick={async () => {
                                if (window.confirm(`¿Seguro que querés dar de baja la cuenta de ${client.name}? Se bloqueará su login inmediato.`)) {
                                  try {
                                    const response = await api.delete(`/auth/clients/${client.id}`);
                                    setSystemMessage(`✅ ${response.data.message}`);
                                    setClientList(prev => prev.map(c => c.id === client.id ? { ...c, is_active: false } : c));
                                  } catch (err) {
                                    setSystemMessage('🚨 Error al procesar la baja lógica.');
                                  }
                                }
                              }}
                              className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition cursor-pointer"
                            >
                              Desactivar
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Cuenta Suspendida</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeModule === 'client-form' && (
          <ClientForm setSystemMessage={setSystemMessage} />
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