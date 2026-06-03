import React, { useState, useEffect } from 'react';
import { api } from '../../config/api';
import { formatPrice } from '../../../utils/currency';
import { Package, Calendar, Phone, MapPin, ChevronDown, ChevronUp, Clock, Search, Filter, X, Download } from 'lucide-react';

export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [filters, setFilters] = useState({
    customer: '',
    startDate: '',
    endDate: '',
    product: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.customer) queryParams.append('customer', filters.customer);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.product) queryParams.append('product', filters.product);
      if (filters.status) queryParams.append('status', filters.status);

      const response = await api.get(`/orders?${queryParams.toString()}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrderDetails(response.data);
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  const toggleExpand = (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      fetchOrderDetails(orderId);
    }
  };

  const resetFilters = () => {
    setFilters({
      customer: '',
      startDate: '',
      endDate: '',
      product: '',
      status: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado': return 'bg-green-900/30 text-green-400 border-green-900/50';
      case 'Cancelado': return 'bg-red-900/30 text-red-400 border-red-900/50';
      case 'Enviado': return 'bg-blue-900/30 text-blue-400 border-blue-900/50';
      default: return 'bg-amber-900/30 text-amber-400 border-amber-900/50';
    }
  };

  if (isLoading && orders.length === 0) return <div className="text-center py-10 text-slate-400 font-bold animate-pulse">Cargando inteligencia de ventas...</div>;

  return (
    <div className="space-y-6">
      {/* HEADER & TOP ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center">
            <Package className="mr-3 text-[#deff9a]" size={28} /> Control de Logística
          </h2>
          <p className="text-xs text-slate-400 font-medium">Gestioná, filtrá y auditá todos los pedidos del sistema.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all border ${showFilters ? 'bg-[#deff9a] text-black border-[#deff9a]' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'} cursor-pointer`}
          >
            <Filter size={14} className="mr-2" /> {showFilters ? 'Ocultar Filtros' : 'Filtrar Historial'}
          </button>
          <button onClick={fetchOrders} className="p-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition border border-slate-700 cursor-pointer">
            <Clock size={18} />
          </button>
        </div>
      </div>

      {/* ADVANCED FILTER BAR */}
      {showFilters && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Cliente / Email</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  type="text" 
                  value={filters.customer}
                  onChange={e => setFilters({...filters, customer: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 pl-10 text-xs text-white outline-none focus:border-[#deff9a] transition-all"
                  placeholder="Ej: Juan Pérez..."
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Producto / SKU</label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  type="text" 
                  value={filters.product}
                  onChange={e => setFilters({...filters, product: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 pl-10 text-xs text-white outline-none focus:border-[#deff9a] transition-all"
                  placeholder="Ej: Hamburguesa..."
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Estado</label>
              <select 
                value={filters.status}
                onChange={e => setFilters({...filters, status: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#deff9a] transition-all"
              >
                <option value="">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Enviado">Enviado</option>
                <option value="Completado">Completado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Desde Fecha</label>
              <input 
                type="date" 
                value={filters.startDate}
                onChange={e => setFilters({...filters, startDate: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#deff9a] transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Hasta Fecha</label>
              <input 
                type="date" 
                value={filters.endDate}
                onChange={e => setFilters({...filters, endDate: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#deff9a] transition-all"
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={resetFilters}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
              >
                <X size={14} className="mr-2" /> Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDERS LIST */}
      {orders.length === 0 ? (
        <div className="bg-slate-900/50 rounded-3xl p-20 text-center border-2 border-dashed border-slate-800">
          <Search size={48} className="mx-auto mb-4 text-slate-700" />
          <h3 className="text-white font-bold text-lg">No hay resultados</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">No encontramos pedidos que coincidan con tus filtros actuales. Probá ajustando la búsqueda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mostrando {orders.length} pedidos</span>
          </div>
          
          <div className="grid gap-3">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className={`group bg-[#020617] border rounded-3xl overflow-hidden transition-all duration-300 ${expandedOrderId === order.id ? 'border-[#deff9a] ring-4 ring-[#deff9a]/5' : 'border-slate-800 hover:border-slate-700 shadow-sm'}`}
              >
                <div 
                  className="p-5 cursor-pointer flex flex-wrap items-center justify-between gap-6"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-center space-x-5">
                    <div className={`p-4 rounded-2xl transition-colors ${expandedOrderId === order.id ? 'bg-[#deff9a] text-black' : 'bg-slate-900 text-slate-400 group-hover:bg-slate-800'}`}>
                      <Package size={22} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-0.5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">ID #{order.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusColor(order.status)}`}>{order.status}</span>
                      </div>
                      <p className="text-sm font-bold text-white tracking-tight">{order.customer_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="hidden lg:block text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Fecha Pedido</p>
                      <p className="text-xs text-slate-300 font-medium">{new Date(order.created_at).toLocaleDateString('es-AR')}</p>
                    </div>
                    <div className="hidden sm:block text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Logística</p>
                      <p className="text-xs text-slate-300 font-medium">{order.delivery_type}</p>
                    </div>
                    <div className="text-right min-w-24">
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Monto Total</p>
                      <p className="text-base font-black text-[#deff9a]">${formatPrice(parseFloat(order.total_amount))}</p>
                    </div>
                    <div className={`p-2 rounded-full transition-transform duration-300 ${expandedOrderId === order.id ? 'rotate-180 bg-[#deff9a]/10 text-[#deff9a]' : 'text-slate-600'}`}>
                      <ChevronDown size={20} />
                    </div>
                  </div>
                </div>

                {expandedOrderId === order.id && (
                  <div className="px-6 pb-6 border-t border-slate-800 bg-slate-950/40 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid lg:grid-cols-12 gap-8 pt-6">
                      
                      {/* INFORMACIÓN DE ENTREGA */}
                      <div className="lg:col-span-4 space-y-6">
                        <div>
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                            <MapPin size={12} className="mr-2" /> Destino y Contacto
                          </h3>
                          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 space-y-3">
                            <div className="flex items-start">
                              <Phone size={14} className="mt-0.5 mr-3 text-slate-500 shrink-0" />
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Teléfono</p>
                                <p className="text-xs text-white font-medium">{order.customer_phone}</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <MapPin size={14} className="mt-0.5 mr-3 text-slate-500 shrink-0" />
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Dirección</p>
                                <p className="text-xs text-white font-medium leading-relaxed">{order.delivery_address}</p>
                              </div>
                            </div>
                            {order.delivery_date && (
                              <div className="flex items-start">
                                <Calendar size={14} className="mt-0.5 mr-3 text-slate-500 shrink-0" />
                                <div>
                                  <p className="text-[10px] text-slate-500 uppercase font-bold">Fecha Pactada</p>
                                  <p className="text-xs text-[#deff9a] font-black">{order.delivery_date}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ACCIONES DE ESTADO */}
                        <div>
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                            <Clock size={12} className="mr-2" /> Gestión de Estado
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => updateStatus(order.id, 'Enviado')}
                              className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${order.status === 'Enviado' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-blue-400 border-slate-800 hover:bg-slate-800'} cursor-pointer`}
                            >
                              Marcar Enviado
                            </button>
                            <button 
                              onClick={() => updateStatus(order.id, 'Completado')}
                              className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${order.status === 'Completado' ? 'bg-green-600 text-white border-green-500' : 'bg-slate-900 text-green-400 border-slate-800 hover:bg-slate-800'} cursor-pointer`}
                            >
                              Completar
                            </button>
                            <button 
                              onClick={() => updateStatus(order.id, 'Cancelado')}
                              className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${order.status === 'Cancelado' ? 'bg-red-600 text-white border-red-500' : 'bg-slate-900 text-red-400 border-slate-800 hover:bg-slate-800'} cursor-pointer`}
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={() => updateStatus(order.id, 'Pendiente')}
                              className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${order.status === 'Pendiente' ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-900 text-amber-400 border-slate-800 hover:bg-slate-800'} cursor-pointer`}
                            >
                              Pendiente
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* DETALLE DE PRODUCTOS */}
                      <div className="lg:col-span-8 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                            <Download size={12} className="mr-2" /> Items del Pedido
                          </h3>
                        </div>
                        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-900/50">
                                <th className="p-3 text-[9px] font-black text-slate-500 uppercase">Producto</th>
                                <th className="p-3 text-[9px] font-black text-slate-500 uppercase text-center">Cant.</th>
                                <th className="p-3 text-[9px] font-black text-slate-500 uppercase text-right">Unitario</th>
                                <th className="p-3 text-[9px] font-black text-slate-500 uppercase text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900">
                              {orderDetails.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                                  <td className="p-3">
                                    <p className="text-xs font-bold text-white">{item.product_name}</p>
                                    <p className="text-[9px] text-slate-500 font-mono uppercase">{item.product_sku}</p>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="px-2 py-0.5 bg-slate-800 rounded text-xs font-black text-[#deff9a]">{item.quantity}</span>
                                  </td>
                                  <td className="p-3 text-xs text-slate-400 text-right font-medium">${formatPrice(parseFloat(item.unit_price))}</td>
                                  <td className="p-3 text-xs text-white text-right font-black">${formatPrice(parseFloat(item.subtotal))}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-900/80">
                                <td colSpan={3} className="p-4 text-right">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total del Pedido:</span>
                                </td>
                                <td className="p-4 text-right">
                                  <span className="text-base font-black text-[#deff9a]">${formatPrice(parseFloat(order.total_amount))}</span>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                        {order.observations && (
                          <div className="bg-[#deff9a]/5 border border-[#deff9a]/20 p-4 rounded-2xl">
                            <p className="text-[10px] font-black text-[#deff9a] uppercase mb-1 tracking-widest">Notas del Cliente:</p>
                            <p className="text-xs text-slate-300 italic leading-relaxed">"{order.observations}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
