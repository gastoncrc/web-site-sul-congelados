import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Package, Users, Menu, Settings, ShoppingBag, TrendingUp, Upload } from 'lucide-react';
import { api } from '../config/api';

// IMPORTAMOS LOS COMPONENTES MODULARIZADOS
import { ProductList } from '../components/admin/ProductList';
import { ClientList } from '../components/admin/ClientList';
import { UserList } from '../components/admin/UserList';
import { OrderList } from '../components/admin/OrderList';
import { DashboardStats } from '../components/admin/DashboardStats';
import { PriceListManager } from '../components/admin/PriceListManager';
import { BulkImportModal } from '../components/admin/BulkImportModal';

interface AdminProps {
  setSystemMessage: (msg: string) => void;
}

type ActiveModule = 'dashboard' | 'order-list' | 'catalog' | 'client-list' | 'user-list' | 'config';

const NAV_ITEMS: { id: ActiveModule; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'dashboard', label: 'Inicio', Icon: TrendingUp },
  { id: 'order-list', label: 'Pedidos', Icon: ShoppingBag },
  { id: 'catalog', label: 'Catálogo', Icon: Package },
  { id: 'client-list', label: 'Clientes', Icon: Users },
  { id: 'user-list', label: 'Usuarios', Icon: UserIcon },
  { id: 'config', label: 'Ajustes', Icon: Settings },
];

export const Admin: React.FC<AdminProps> = ({ setSystemMessage }) => {
  const { user, logout } = useAuth();

  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [catalogTab, setCatalogTab] = useState<'productos' | 'listas'>('productos');
  const [showCatalogImport, setShowCatalogImport] = useState(false);

  // Data States
  const [productList, setProductList] = useState<any[]>([]);
  const [clientList, setClientList] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  // Borradores de los inputs de Ajustes — controlados de verdad, sincronizados cada vez
  // que llegan ajustes frescos del servidor. Antes eran defaultValue (no controlados):
  // si el componente se mostraba antes de que resolviera el fetch, quedaban pegados al
  // valor de respaldo hardcodeado para siempre, aunque los datos reales llegaran después.
  const [whatsappDraft, setWhatsappDraft] = useState('5493510000000');
  const [minPurchaseDraft, setMinPurchaseDraft] = useState('30000');
  const [defaultConvenioDraft, setDefaultConvenioDraft] = useState('Gastronomica');

  useEffect(() => {
    setWhatsappDraft(settings.whatsapp_number || '5493510000000');
    setMinPurchaseDraft(settings.min_purchase_b2c || '30000');
    setDefaultConvenioDraft(settings.default_minorista_convenio || 'Gastronomica');
  }, [settings]);

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
    if (activeModule === 'catalog') fetchAdminData();
    if (activeModule === 'client-list' || activeModule === 'user-list') fetchClientsData();
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

  if (user?.role !== 'Admin') return null;

  return (
    <div className="flex h-full w-full bg-brand-primary overflow-hidden">

      {/* SIDEBAR */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-60'} bg-gradient-to-b from-brand-primary to-[#4a1810] flex flex-col shrink-0 transition-all duration-300`}>
        <div className="flex flex-col h-full">

          <div className="h-20 flex items-center justify-between px-4 sm:px-6 border-b border-white/10 shrink-0">
            {!isSidebarCollapsed ? (
              <div>
                <h2 className="text-white text-sm font-black tracking-wide">SUL Congelados</h2>
                <p className="text-[10px] uppercase tracking-widest text-white/50 mt-0.5">Panel admin</p>
              </div>
            ) : (
              <h2 className="text-white text-lg font-black mx-auto">S</h2>
            )}
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-white/60 hover:text-white p-1 ml-2 cursor-pointer shrink-0">
              <Menu size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
            {NAV_ITEMS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveModule(id)}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : ''} gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                  activeModule === id ? 'bg-brand-gold text-brand-gold-on' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={19} />
                {!isSidebarCollapsed && <span>{label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10 shrink-0">
            {!isSidebarCollapsed && (
              <div className="flex items-center space-x-3 mb-3 px-1">
                <div className="bg-brand-accent w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-black">
                  {(user?.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">{user?.name || 'Usuario'}</p>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider truncate">Administrador</p>
                </div>
              </div>
            )}
            <button onClick={logout} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start px-3'} gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white py-2.5 rounded-xl transition-colors border border-white/10 font-bold text-sm cursor-pointer`}>
              <LogOut size={17} className="shrink-0" />
              {!isSidebarCollapsed && <span>Cerrar sesión</span>}
            </button>
          </div>

        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 overflow-y-auto bg-bg p-6 sm:p-10 relative">

        {activeModule === 'dashboard' && <DashboardStats />}
        {activeModule === 'order-list' && <OrderList />}

        {activeModule === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-black text-ink uppercase">Catálogo</h1>
                <p className="text-xs text-ink-soft mt-1">Productos y listas de precios</p>
              </div>
              <button onClick={() => setShowCatalogImport(true)} className="bg-paper border border-line text-ink px-4 py-2.5 rounded-xl text-xs font-bold hover:border-brand-gold transition cursor-pointer inline-flex items-center gap-1.5 shrink-0">
                <Upload size={14}/> Importar Excel
              </button>
            </div>

            <div className="inline-flex bg-paper border border-line rounded-xl p-1 gap-1">
              <button
                onClick={() => setCatalogTab('productos')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${catalogTab === 'productos' ? 'bg-brand-primary text-brand-primary-on' : 'text-ink-soft hover:bg-bg'}`}
              >
                Productos
              </button>
              <button
                onClick={() => setCatalogTab('listas')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${catalogTab === 'listas' ? 'bg-brand-primary text-brand-primary-on' : 'text-ink-soft hover:bg-bg'}`}
              >
                Listas de precios
              </button>
            </div>

            {catalogTab === 'productos'
              ? <ProductList products={productList} onRefresh={fetchAdminData} setSystemMessage={setSystemMessage} />
              : <PriceListManager setSystemMessage={setSystemMessage} />}

            <BulkImportModal
              isOpen={showCatalogImport}
              onClose={() => setShowCatalogImport(false)}
              endpoint="/products/upload-prices"
              title="Importar Precios (Excel)"
              hint="Sincronizá el catálogo desde el Excel de convenios (codigo, descrip, precio1, porcentaje, preciofinal, convenio, rubro_descrip, subrubro_descrip)."
              onSuccess={fetchAdminData}
              setSystemMessage={setSystemMessage}
            />
          </div>
        )}

        {activeModule === 'client-list' && (
          <ClientList clientList={clientList} setClientList={setClientList} setSystemMessage={setSystemMessage} onDataChange={fetchClientsData} />
        )}
        {activeModule === 'user-list' && (
          <UserList clientList={clientList} setClientList={setClientList} setSystemMessage={setSystemMessage} onDataChange={fetchClientsData} />
        )}

        {activeModule === 'config' && (
          <div className="bg-paper p-8 rounded-card border border-line shadow-sm max-w-xl mx-auto mt-6 animate-in fade-in">
            <h3 className="font-black text-lg text-ink uppercase tracking-wider mb-2">Ajustes Generales</h3>
            <p className="text-xs text-ink-soft mb-6 font-medium">Gestioná los parámetros operativos del sistema sin tocar el código.</p>

            <div className="space-y-8">
              {/* WhatsApp Number */}
              <div>
                <label className="block text-xs font-black text-ink-soft uppercase mb-2">Número de WhatsApp (Recepción de Pedidos)</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={whatsappDraft}
                    onChange={e => setWhatsappDraft(e.target.value)}
                    className="p-3 border border-line rounded-xl bg-bg text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold w-full font-mono font-bold"
                    placeholder="Ej: 5493510000000"
                  />
                  <button
                    onClick={() => handleUpdateSetting('whatsapp_number', whatsappDraft)}
                    className="bg-brand-primary text-brand-primary-on font-bold px-6 rounded-xl text-xs hover:bg-brand-accent transition shadow-sm cursor-pointer shrink-0"
                  >
                    Guardar
                  </button>
                </div>
                <p className="text-[10px] text-ink-soft mt-1">Incluí el código de país (54) y área (9) sin espacios ni guiones.</p>
              </div>

              {/* Mínimo Compra B2C */}
              <div>
                <label className="block text-xs font-black text-ink-soft uppercase mb-2">Mínimo de Compra B2C para Envíos ($)</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={minPurchaseDraft}
                    onChange={e => setMinPurchaseDraft(e.target.value)}
                    className="p-3 border border-line rounded-xl bg-bg text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold w-full font-mono font-bold"
                    placeholder="Ej: 30000"
                  />
                  <button
                    onClick={() => handleUpdateSetting('min_purchase_b2c', minPurchaseDraft)}
                    className="bg-brand-primary text-brand-primary-on font-bold px-6 rounded-xl text-xs hover:bg-brand-accent transition shadow-sm cursor-pointer shrink-0"
                  >
                    Guardar
                  </button>
                </div>
              </div>

              {/* Lista de precios default — visitantes sin cuenta y Minoristas nuevos */}
              <div>
                <label className="block text-xs font-black text-ink-soft uppercase mb-2">Lista de Precios por Defecto</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={defaultConvenioDraft}
                    onChange={e => setDefaultConvenioDraft(e.target.value)}
                    className="p-3 border border-line rounded-xl bg-bg text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold w-full font-mono font-bold"
                    placeholder="Ej: Gastronomica"
                  />
                  <button
                    onClick={() => handleUpdateSetting('default_minorista_convenio', defaultConvenioDraft)}
                    className="bg-brand-primary text-brand-primary-on font-bold px-6 rounded-xl text-xs hover:bg-brand-accent transition shadow-sm cursor-pointer shrink-0"
                  >
                    Guardar
                  </button>
                </div>
                <p className="text-[10px] text-ink-soft mt-1">Tiene que ser el nombre exacto de una de las listas reales (ej. Gastronomica, Unica). Es la lista que ve cualquiera que navegue el catálogo sin estar logueado, y la que se le asigna a todo Minorista que se registre solo desde la web o se cree sin elegir una lista puntual.</p>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
};
