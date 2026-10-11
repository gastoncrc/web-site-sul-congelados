import React, { useState, useEffect } from 'react';
import { Package, RotateCcw } from 'lucide-react';
import { api } from '../config/api';
import { formatPrice } from '../../utils/currency';
import { useAuth } from '../context/AuthContext';

interface OrderSummary {
  id: number;
  created_at: string;
  total_amount: string | number;
  status: string;
  item_count: string | number;
}

interface MisPedidosProps {
  setShoppingCart: React.Dispatch<React.SetStateAction<any[]>>;
  openLogin: () => void;
}

export const MisPedidos: React.FC<MisPedidosProps> = ({ setShoppingCart, openLogin }) => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    api.get('/orders').then(res => setOrders(res.data)).catch(() => setOrders([])).finally(() => setIsLoading(false));
  }, [token]);

  const handleRepetirPedido = async (orderId: number) => {
    setReorderingId(orderId);
    setMessage('');
    try {
      const itemsRes = await api.get(`/orders/${orderId}`);
      const items: { product_sku: string; quantity: number }[] = itemsRes.data;
      if (items.length === 0) { setMessage('Ese pedido no tiene productos para repetir.'); return; }

      const skus = items.map(i => i.product_sku).join(',');
      const productsRes = await api.get('/products', { params: { skus } });
      const currentProducts: Record<string, any> = {};
      for (const p of productsRes.data.products) currentProducts[p.sku] = p;

      const missing = items.filter(i => !currentProducts[i.product_sku]);

      setShoppingCart((prevCart: any[]) => {
        const newCart = [...prevCart];
        for (const item of items) {
          const product = currentProducts[item.product_sku];
          if (!product) continue;
          const idx = newCart.findIndex(ci => ci.product.sku === item.product_sku);
          if (idx >= 0) newCart[idx] = { ...newCart[idx], quantity: newCart[idx].quantity + item.quantity };
          else newCart.push({ product, quantity: item.quantity });
        }
        return newCart;
      });

      if (missing.length > 0) {
        setMessage(`Se agregaron ${items.length - missing.length} de ${items.length} productos. ${missing.length} ya no están disponibles: ${missing.map(m => m.product_sku).join(', ')}.`);
      } else {
        setMessage(`✅ Los ${items.length} productos se agregaron a tu carrito con el precio actual. Abrí el carrito para confirmar.`);
      }
    } catch (err) {
      setMessage('No pudimos repetir el pedido. Probá de nuevo en un momento.');
    } finally {
      setReorderingId(null);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20 bg-paper border border-line rounded-card">
        <Package size={40} className="mx-auto mb-4 text-ink-soft opacity-40" />
        <p className="text-ink font-bold mb-4">Iniciá sesión para ver tu historial de pedidos.</p>
        <button onClick={openLogin} className="bg-brand-primary text-brand-primary-on font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-brand-accent transition cursor-pointer">Iniciar sesión</button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-black text-ink font-heading">Mis Pedidos</h1>
        <p className="text-sm text-ink-soft mt-1">Repetí un pedido anterior con el precio actual, sin rearmar todo de cero.</p>
      </div>

      {message && <div className="bg-brand-gold/10 border border-brand-gold/30 text-ink text-sm rounded-xl p-3">{message}</div>}

      {isLoading ? (
        <div className="text-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-paper border border-line rounded-card">
          <Package size={40} className="mx-auto mb-4 text-ink-soft opacity-40" />
          <p className="text-ink-soft font-bold">Todavía no tenés pedidos registrados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-paper border border-line rounded-card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-ink">Pedido #{order.id} · {new Date(order.created_at).toLocaleDateString('es-AR')}</p>
                <p className="text-xs text-ink-soft mt-1">{order.item_count} producto{Number(order.item_count) !== 1 ? 's' : ''} · ${formatPrice(parseFloat(order.total_amount as string))} · {order.status}</p>
              </div>
              <button
                onClick={() => handleRepetirPedido(order.id)}
                disabled={reorderingId === order.id}
                className="shrink-0 flex items-center gap-2 bg-brand-primary text-brand-primary-on font-bold px-4 py-2 rounded-xl text-xs hover:bg-brand-accent transition cursor-pointer disabled:opacity-50"
              >
                <RotateCcw size={14} className={reorderingId === order.id ? 'animate-spin' : ''} />
                Repetir pedido
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
