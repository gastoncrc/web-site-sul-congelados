import React from 'react';
import { ShoppingBag, ShoppingCart, Trash2, Flame, Plus, Minus } from 'lucide-react';
import type { Product, CartItem } from '../types'; 
import { useAuth } from '../context/AuthContext';

// Escudo B2B para TypeScript
interface B2BProduct extends Product {
  isActive?: boolean;
  isPromo?: boolean;
  promoPrice?: number;
}

interface CatalogProps {
  products: Product[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  openLogin: () => void;
}

export const Catalog: React.FC<CatalogProps> = ({ products, cart, setCart, openLogin }) => {
  const { user } = useAuth();
  const convenioAsignado = user ? (user as any).convenio : 'GENERAL';

  const catProducts = products as B2BProduct[];
  const promoProducts = catProducts.filter(p => p.isPromo && p.isActive !== false);
  const regularProducts = catProducts.filter(p => !p.isPromo && p.isActive !== false);

  const addToCart = (product: B2BProduct, usePromoPrice: boolean = false) => {
    setCart(prev => {
      const exists = prev.find(item => item.product.sku === product.sku);
      if (exists) {
        return prev.map(item => item.product.sku === product.sku ? { ...item, quantity: item.quantity + 1 } : item);
      }
      const finalPrice = usePromoPrice && product.promoPrice ? product.promoPrice : product.unitPrice;
      const cartProduct: Product = { ...product, unitPrice: finalPrice };
      return [...prev, { product: cartProduct, quantity: 1 }];
    });
  };

  // 🚀 NUEVA FUNCIÓN: Sumar o restar desde el carrito
  const updateQuantity = (sku: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.sku === sku) {
        const newQuantity = item.quantity + delta;
        // Si baja de 1, se queda en 1 (para borrar, se usa el tachito)
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }));
  };

  const calculateTotal = () => cart.reduce((acc, item) => acc + (item.product.unitPrice * item.quantity), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 relative">
      
      {/* 📦 SECCIÓN IZQUIERDA: PRODUCTOS (Ocupa 2 columnas en Desktop) */}
      <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
        
        {/* CARRUSEL PROMOS */}
        {promoProducts.length > 0 && (
          <div className="bg-linear-to-r from-red-600 to-orange-500 rounded-2xl p-4 sm:p-6 shadow-lg">
            <h2 className="text-white text-lg sm:text-xl font-black uppercase flex items-center mb-4">
              <Flame className="mr-2" /> Promociones Activas
            </h2>
            <div className="flex overflow-x-auto pb-4 snap-x hide-scrollbar space-x-4">
              {promoProducts.map(p => (
                <div key={`promo-${p.sku}`} className="snap-start shrink-0 w-56 sm:w-64 bg-white rounded-xl p-4 shadow-md flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase bg-red-100 text-red-600 px-2 py-1 rounded">Promo</span>
                    <h3 className="text-sm font-bold text-gray-900 mt-2 line-clamp-2">{p.name}</h3>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 line-through block">${p.unitPrice.toLocaleString('es-AR')}</span>
                      <span className="text-xl font-black text-red-600">${p.promoPrice?.toLocaleString('es-AR')}</span>
                    </div>
                    <button onClick={() => addToCart(p, true)} className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition">
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATÁLOGO GENERAL */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#003366] uppercase tracking-wide">Catálogo General</h2>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
              Lista: {convenioAsignado}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {regularProducts.length > 0 ? (
              regularProducts.map(p => (
                <div key={p.sku} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">{p.category}</span>
                    <h3 className="text-base font-bold text-gray-900 mt-2">{p.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 font-mono">SKU: {p.sku}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">Precio Neto B2B</span>
                      <span className="text-lg font-black text-[#003366]">${p.unitPrice.toLocaleString('es-AR')}</span>
                    </div>
                    <button onClick={() => addToCart(p, false)} className="bg-[#003366] text-white p-2 rounded-lg hover:bg-blue-800 transition">
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border p-8 rounded-xl text-center col-span-1 sm:col-span-2 shadow-sm">
                <p className="text-gray-500 text-sm font-medium mb-4">No hay productos disponibles en esta lista.</p>
                {!user && (
                  <button onClick={openLogin} className="bg-[#003366] text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow hover:bg-blue-800 transition">Iniciar Sesión B2B</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🧾 SECCIÓN DERECHA: CARRITO (Arriba en celular, Derecha pegajosa en Desktop) */}
      <div className="order-1 lg:order-2 relative z-20">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm sticky top-24">
          <h3 className="text-lg font-black text-[#003366] uppercase tracking-wider mb-4 flex items-center space-x-2">
            <ShoppingBag size={18} /> <span>Tu Pedido</span>
          </h3>
          
          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Aún no seleccionaste artículos.</p>
          ) : (
            <div className="space-y-4 max-h-[50vh] lg:max-h-none overflow-y-auto pr-2 relative z-30">
              {cart.map(item => (
                <div key={item.product.sku} className="flex justify-between items-center text-sm pb-3 border-b border-gray-100">
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-gray-900 text-xs sm:text-sm leading-tight">{item.product.name}</p>
                    <p className="text-[11px] text-gray-500 mt-1">${item.product.unitPrice.toLocaleString('es-AR')} c/u</p>
                    
                    {/* 🚀 CONTROLES + y - REFORZADOS PARA DESKTOP */}
                    <div className="flex items-center space-x-3 mt-2">
                      <div className="flex items-center bg-gray-100 rounded-md border border-gray-200 relative z-40">
                        <button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(item.product.sku, -1); }} 
                          className="px-2.5 py-1 text-gray-600 hover:text-black hover:bg-gray-200 rounded-l-md transition cursor-pointer select-none font-bold"
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        
                        <span className="text-xs font-black w-6 text-center select-none text-slate-900">{item.quantity}</span>
                        
                        <button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(item.product.sku, 1); }} 
                          className="px-2.5 py-1 text-gray-600 hover:text-black hover:bg-gray-200 rounded-r-md transition cursor-pointer select-none font-bold"
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>
                      
                      {/* ✅ CORRECCIÓN APLICADA ACÁ */}
                      <span className="text-xs font-bold text-[#003366] min-w-17.5 text-right">
                        ${(item.product.unitPrice * item.quantity).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCart(prev => prev.filter(i => i.product.sku !== item.product.sku)); }} 
                    className="text-red-400 hover:text-red-600 shrink-0 p-2 bg-red-50 rounded-lg ml-2 transition cursor-pointer relative z-40"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              
              <div className="pt-4 flex justify-between items-center font-black text-base sm:text-lg text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span>Total:</span>
                <span className="text-[#003366]">${calculateTotal().toLocaleString('es-AR')}</span>
              </div>
              <button 
                type="button"
                onClick={() => alert('Pedido en proceso de envío...')} 
                className="w-full bg-[#003366] text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition mt-2 text-sm shadow-md cursor-pointer relative z-40"
              >
                Confirmar Orden
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};