import React, { useState, useEffect } from 'react';
import { api } from '../../config/api';
import { formatPrice } from '../../../utils/currency';
import { Package, Calendar, Phone, MapPin, ChevronDown, ChevronUp, Clock } from 'lucide-react';

export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
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
    fetchOrders();
  }, []);

  const toggleExpand = (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      fetchOrderDetails(orderId);
    }
  };

  if (isLoading) return <div className="text-center py-10 text-white">Cargando pedidos...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-[#deff9a] uppercase tracking-wider flex items-center">
          <Package className="mr-2" /> Historial de Pedidos
        </h2>
        <button onClick={fetchOrders} className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded hover:bg-slate-700 transition">Actualizar</button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-slate-800/50 rounded-2xl p-10 text-center border border-slate-700">
          <Clock size={48} className="mx-auto mb-4 text-slate-600 opacity-50" />
          <p className="text-slate-400">No se encontraron pedidos registrados.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div key={order.id} className={`bg-slate-800 border rounded-2xl overflow-hidden transition-all ${expandedOrderId === order.id ? 'border-[#deff9a]/50 ring-1 ring-[#deff9a]/20' : 'border-slate-700 hover:border-slate-600'}`}>
              <div 
                className="p-4 cursor-pointer flex flex-wrap items-center justify-between gap-4"
                onClick={() => toggleExpand(order.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-slate-900 p-3 rounded-xl text-[#deff9a]">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pedido #${order.id}</p>
                    <p className="text-sm font-bold text-white">{order.customer_name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="hidden sm:block">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Fecha</p>
                    <p className="text-xs text-slate-300 flex items-center"><Calendar size={12} className="mr-1"/> {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Entrega</p>
                    <p className="text-xs text-slate-300">{order.delivery_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Total</p>
                    <p className="text-sm font-black text-[#deff9a]">${formatPrice(parseFloat(order.total_amount))}</p>
                  </div>
                  <div className="text-slate-500">
                    {expandedOrderId === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {expandedOrderId === order.id && (
                <div className="px-4 pb-4 border-t border-slate-700 bg-slate-900/50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid md:grid-cols-2 gap-6 pt-4">
                    {/* Información del Cliente */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">Datos de Envío</h3>
                      <div className="space-y-2">
                        <p className="text-xs text-slate-300 flex items-center"><Phone size={12} className="mr-2 text-slate-500"/> {order.customer_phone}</p>
                        <p className="text-xs text-slate-300 flex items-center"><MapPin size={12} className="mr-2 text-slate-500"/> {order.delivery_address}</p>
                        {order.delivery_date && <p className="text-xs text-slate-300 flex items-center"><Calendar size={12} className="mr-2 text-slate-500"/> Pactado: {order.delivery_date}</p>}
                        <p className="text-xs text-slate-300 flex items-center"><Clock size={12} className="mr-2 text-slate-500"/> Estado: <span className="ml-2 px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-full text-[10px] font-bold uppercase">{order.status}</span></p>
                      </div>
                      {order.observations && (
                        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 mt-2">
                          <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Observaciones:</p>
                          <p className="text-xs text-slate-300 italic">"{order.observations}"</p>
                        </div>
                      )}
                    </div>

                    {/* Detalle de Productos */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">Productos</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {orderDetails.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-800/50 p-2 rounded-lg border border-slate-800">
                            <div className="flex-1">
                              <p className="text-xs font-bold text-white">{item.product_name}</p>
                              <p className="text-[10px] text-slate-500">SKU: {item.product_sku} | {item.quantity} x ${formatPrice(parseFloat(item.unit_price))}</p>
                            </div>
                            <p className="text-xs font-black text-white ml-2">${formatPrice(parseFloat(item.subtotal))}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
