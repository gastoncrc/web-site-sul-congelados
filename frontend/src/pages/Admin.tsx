import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Package, Users, ChevronDown, ChevronRight, Upload, Menu, Settings, ShoppingBag } from 'lucide-react';
import { api } from '../config/api';

// IMPORTAMOS LOS COMPONENTES MODULARIZADOS
import { ProductList } from '../components/admin/ProductList';
import { ClientForm } from '../components/admin/ClientForm';
import { ClientList } from '../components/admin/ClientList';
import { OrderList } from '../components/admin/OrderList';

interface AdminProps {
  setSystemMessage: React.Dispatch<React.SetStateAction<string>>;
  triggerDataRefresh: () => Promise<void>;
}

// 🚀 COMPONENTE PARA ALTA DE USUARIOS/ADMINS
const UserForm = ({ setSystemMessage }: { setSystemMessage: any }) => {
  const [form, setForm] = useState({ email: '', password: '', role: 'Admin', convenio: 'GENERAL', telefono: '', domicilio_facturacion: '', vendedor: '', grupo: '' });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    try { 
      await api.post('/auth/admin-create-user', form); 
      setSystemMessage('✅ Usuario creado exitosamente'); 
      setForm({ email: '', password: '', role: 'Admin', convenio: 'GENERAL', telefono: '', domicilio_facturacion: '', vendedor: '', grupo: '' }); 
    } catch(e) { 
      setSystemMessage('🚨 Error al crear usuario'); 
    }
  };

  return (
    <form className="bg-white p-6 rounded-2xl max-w-xl mx-auto space-y-4 shadow-sm border border-slate-200 mt-10 animate-in fade-in" onSubmit={handleSubmit}>
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
  
  // Navigation & UI States
  const [activeModule, setActiveModule] = useState<'product-list' | 'product-bulk' | 'client-list' | 'client-form' | 'client-bulk' | 'user-form' | 'config' | 'order-list'>('order-list');
  const [expandedSection, setExpandedSection] = useState<'products' | 'clients' | 'users' | 'settings' | 'orders' | null>('orders');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Data States
  const [productList, setProductList] = useState<any[]>([]);
  const [clientList, setClientList] = useState<any[]>([]); 
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const fetchAdminData = async () => {
    try {
      const response = await api.get(`/products/admin?t=${new Date().getTime()}`);
      setProductList(response.data);
    } catch (error) { 
      console.error('Error cargando productos:', error); 
    }
  };

  const fetchClientsData = async () => {
    try {
      const response = await api.get(`/auth/clients?t=${new Date().getTime()}`);
      setClientList(response.data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error cargando ajustes:', error);
    }
  };

  useEffect(() => {
    if (activeModule === 'product-list') fetchAdminData();
    if (activeModule === 'client-list') fetchClientsData(); 
    if (activeModule === 'config') fetchSettings();
  }, [activeModule]);

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      await api.post('/settings/update', { key, value });
      setSystemMessage('✅ Ajuste actualizado correctamente.');
      fetchSettings();
    } catch (error) {
      setSystemMessage('🚨 Error al actualizar el ajuste.');
    }
  };

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

  const toggleSection = (section: 'products' | 'clients' | 'users' | 'settings' | 'orders') => {
    if (isSidebarCollapsed) setIsSidebarCollapsed(false);
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (user?.role !== 'Admin') return null;

  return (
    <div className="flex h-full w-full bg-[#0f172a] overflow-hidden">
      
      {/* 🌑 SIDEBAR */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-[#020617] border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300`}>
        <div className="flex flex-col h-full">
          
          <div className="h-20 flex items-center justify-between px-4 sm:px-6 border-b border-slate-800 shrink-0">
            {!isSidebarCollapsed ? (
              <h2 className="text-white text-sm font-black uppercase tracking-widest">PANEL ADMIN</h2>
            ) : (
              <h2 className="text-white text-lg font-black mx-auto">PA</h2>
            )}
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-slate-400 hover:text-white p-1 ml-2 cursor-pointer">
              <Menu size={20} />
            </button>
          </div>
          
          <nav className="space-y-4 flex-1 overflow-y-auto p-4 sm:p-6">
            
            {/* VENTAS MODULE */}
            <div>
              <button onClick={() => toggleSection('orders')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg transition cursor-pointer ${expandedSection === 'orders' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>
                <div className="flex items-center"><ShoppingBag size={20} className={!isSidebarCollapsed ? "mr-3" : ""} /> {!isSidebarCollapsed && <span className="text-sm font-bold">VENTAS</span>}</div>
                {!isSidebarCollapsed && (expandedSection === 'orders' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>)}
              </button>
              {expandedSection === 'orders' && !isSidebarCollapsed && (
                <div className="ml-9 mt-2 space-y-1">
                  <button onClick={() => setActiveModule('order-list')} className={`w-full text-left p-2 text-xs font-medium rounded cursor-pointer ${activeModule === 'order-list' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Historial de Pedidos</button>
                </div>
              )}
            </div>

            {/* PRODUCT MODULE */}
            <div>
              <button onClick={() => toggleSection('products')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg transition cursor-pointer ${expandedSection === 'products' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>
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
              <button onClick={() => toggleSection('clients')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg transition cursor-pointer ${expandedSection === 'clients' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>
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

            {/* USER MODULE */}
            <div>
              <button onClick={() => toggleSection('users')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg transition cursor-pointer ${expandedSection === 'users' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>
                <div className="flex items-center"><UserIcon size={20} className={!isSidebarCollapsed ? "mr-3" : ""} /> {!isSidebarCollapsed && <span className="text-sm font-bold">USUARIOS</span>}</div>
                {!isSidebarCollapsed && (expandedSection === 'users' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>)}
              </button>
              {expandedSection === 'users' && !isSidebarCollapsed && (
                <div className="ml-9 mt-2 space-y-1">
                  <button onClick={() => setActiveModule('user-form')} className={`w-full text-left p-2 text-xs font-medium rounded cursor-pointer ${activeModule === 'user-form' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Crear Admin / Minorista</button>
                </div>
              )}
            </div>

            {/* 🚀 SETTINGS MODULE */}
            <div>
              <button onClick={() => toggleSection('settings')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg transition cursor-pointer ${expandedSection === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>
                <div className="flex items-center"><Settings size={20} className={!isSidebarCollapsed ? "mr-3" : ""} /> {!isSidebarCollapsed && <span className="text-sm font-bold">AJUSTES</span>}</div>
                {!isSidebarCollapsed && (expandedSection === 'settings' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>)}
              </button>
              {expandedSection === 'settings' && !isSidebarCollapsed && (
                <div className="ml-9 mt-2 space-y-1">
                  <button onClick={() => setActiveModule('config')} className={`w-full text-left p-2 text-xs font-medium rounded cursor-pointer ${activeModule === 'config' ? 'text-[#deff9a]' : 'text-slate-400 hover:text-white'}`}>Reglas B2C</button>
                </div>
              )}
            </div>

          </nav>

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
            <button onClick={logout} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start px-4'} space-x-2 bg-red-900/20 hover:bg-red-900/50 text-red-400 hover:text-red-300 py-3 rounded-lg transition-colors border border-red-900/30 font-bold text-sm cursor-pointer`}>
              <LogOut size={18} className="shrink-0" />
              {!isSidebarCollapsed && <span>Cerrar Sesión</span>}
            </button>
          </div>

        </div>
      </aside>

      {/* 🖥️ MAIN WORKSPACE */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 sm:p-10 relative">
        
        {activeModule === 'order-list' && <OrderList />}
        {activeModule === 'product-list' && <ProductList products={productList} onRefresh={fetchAdminData} setSystemMessage={setSystemMessage} />}
        {activeModule === 'client-list' && <ClientList clientList={clientList} setClientList={setClientList} setSystemMessage={setSystemMessage} />}
        {activeModule === 'client-form' && <ClientForm setSystemMessage={setSystemMessage} />}
        {activeModule === 'user-form' && <UserForm setSystemMessage={setSystemMessage} />}

        {/* 🚀 RENDER DE CONFIGURACIÓN B2C */}
        {activeModule === 'config' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto mt-6 animate-in fade-in">
            <h3 className="font-black text-lg text-slate-900 uppercase tracking-wider mb-2">Configuración Comercial</h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">Gestioná los parámetros operativos del sistema sin tocar el código.</p>
            
            <div className="space-y-8">
              {/* WhatsApp Number */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-2">Número de WhatsApp (Recepción de Pedidos)</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    id="whatsappNumberInput"
                    defaultValue={settings.whatsapp_number || '5493510000000'}
                    className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 w-full font-mono font-bold"
                    placeholder="Ej: 5493510000000"
                  />
                  <button 
                    onClick={() => {
                      const val = (document.getElementById('whatsappNumberInput') as HTMLInputElement).value;
                      handleUpdateSetting('whatsapp_number', val);
                    }}
                    className="bg-slate-900 text-white font-bold px-6 rounded-xl text-xs hover:bg-slate-800 transition shadow-sm cursor-pointer shrink-0"
                  >
                    Guardar
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Incluí el código de país (54) y área (9) sin espacios ni guiones.</p>
              </div>

              {/* Mínimo Compra B2C */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-2">Mínimo de Compra B2C para Envíos ($)</label>
                <div className="flex space-x-2">
                  <input 
                    type="number" 
                    id="minPurchaseInput"
                    defaultValue={localStorage.getItem('sul_min_purchase_b2c') || 30000}
                    className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 w-full font-mono font-bold"
                    placeholder="Ej: 30000"
                  />
                  <button 
                    onClick={() => {
                      const val = (document.getElementById('minPurchaseInput') as HTMLInputElement).value;
                      localStorage.setItem('sul_min_purchase_b2c', val);
                      setSystemMessage('✅ Mínimo de compra B2C actualizado correctamente.');
                    }}
                    className="bg-slate-900 text-white font-bold px-6 rounded-xl text-xs hover:bg-slate-800 transition shadow-sm cursor-pointer shrink-0"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BULK UPLOADS */}
        {(activeModule === 'product-bulk' || activeModule === 'client-bulk') && (
          <div className="max-w-xl mx-auto space-y-6 mt-10 text-center animate-in fade-in">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto"><Upload className="text-blue-600" size={28} /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">Carga Masiva de {activeModule === 'product-bulk' ? 'Productos' : 'Clientes'}</h2>
              <p className="text-slate-400 text-xs mt-1">Sincronizá tu listado mediante un archivo Excel o CSV.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200">
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" id="bulk-file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <label htmlFor="bulk-file" className="cursor-pointer block text-sm text-slate-500 font-medium py-4 hover:text-slate-800 transition">{file ? `Seleccionado: ${file.name}` : "Hacé click para seleccionar matriz CSV/Excel"}</label>
              <button onClick={() => handleBulkUpload(activeModule === 'product-bulk' ? 'products' : 'clients')} disabled={isLoading || !file} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50 text-sm cursor-pointer shadow-md">
                {isLoading ? "Procesando matriz..." : "Sincronizar Base de Datos"}
              </button>
            </div>
          </div>
        )}
      </main>

    </div>
  );
};