import { ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react';
import type { Product, CartItem } from '../types'; 
import { useAuth } from '../context/AuthContext';

interface CatalogProps {
  products: Product[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  openLogin: () => void;
}

export const Catalog: React.FC<CatalogProps> = ({ products, cart, setCart, openLogin }) => {
  const { user } = useAuth();

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(item => item.product.sku === product.sku);
      if (exists) {
        return prev.map(item => item.product.sku === product.sku ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const calculateTotal = () => cart.reduce((acc, item) => acc + (item.product.unitPrice * item.quantity), 0);
  
  // ✅ Forzado relacional dinámico seguro
  const convenioAsignado = user ? (user as any).convenio : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-black text-[#003366] uppercase tracking-wide">Productos</h2>
          {convenioAsignado && (
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
              Lista: {convenioAsignado}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {products.length > 0 ? (
            products.map(p => (
              <div key={p.sku} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">{p.category}</span>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-2">{p.name}</h3>
                  <p className="text-xs text-gray-400 mt-2 font-mono">Código: {p.sku}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Precio Neto B2B</span>
                    <span className="text-lg sm:text-xl font-black text-[#003366]">${p.unitPrice.toLocaleString('es-AR')}</span>
                  </div>
                  <button onClick={() => addToCart(p)} className="bg-[#003366] text-white p-2 rounded-lg hover:bg-blue-800 transition">
                    <ShoppingCart size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border p-8 rounded-xl text-center col-span-1 md:col-span-2 shadow-sm">
              <p className="text-gray-500 text-sm font-medium mb-4">Ingresá con tu cuenta para validar tu convenio corporativo y ver tus precios ciegos.</p>
              <button onClick={openLogin} className="bg-[#003366] text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow hover:bg-blue-800 transition">Identificarse en SUL</button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm h-fit lg:sticky lg:top-24">
        <h3 className="text-lg font-black text-[#003366] uppercase tracking-wider mb-4 flex items-center space-x-2">
          <ShoppingBag size={18} /> <span>Tu Pedido</span>
        </h3>
        {cart.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No seleccionaste bultos todavía.</p>
        ) : (
          <div className="space-y-4">
            {cart.map(item => (
              <div key={item.product.sku} className="flex justify-between items-center text-sm pb-3 border-b border-gray-100">
                <div className="pr-2">
                  <p className="font-bold text-gray-900 text-xs sm:text-sm">{item.product.name}</p>
                  <p className="text-[11px] text-gray-500">{item.quantity} bultos x ${item.product.unitPrice.toLocaleString('es-AR')}</p>
                </div>
                <button onClick={() => setCart(prev => prev.filter(i => i.product.sku !== item.product.sku))} className="text-red-400 hover:text-red-600 flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="pt-4 flex justify-between items-center font-black text-base sm:text-lg text-gray-900">
              <span>Total estimado:</span>
              <span className="text-[#003366]">${calculateTotal().toLocaleString('es-AR')}</span>
            </div>
            <button onClick={() => alert('Pedido enviado con éxito.')} className="w-full bg-[#003366] text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition mt-4 text-sm shadow-md">
              Confirmar Orden B2B
            </button>
          </div>
        )}
      </div>
    </div>
  );
};