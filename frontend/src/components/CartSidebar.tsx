import React, { useState, useEffect } from 'react';
import { X, ShoppingCart as CartIcon, Trash2, MessageCircle, MapPin, User, CreditCard, ChevronLeft } from 'lucide-react';
import { formatPrice } from '../../utils/currency';
import type { Product } from '../types';

interface CartProduct extends Product {
  isPromo?: boolean;
  promoPrice?: number;
  unitPrice: number;
}

interface CartItemType {
  product: CartProduct;
  quantity: number;
}

interface CartSidebarProps {
  isOpen: boolean;
  closeCart: () => void;
  cart: CartItemType[];
  setShoppingCart: React.Dispatch<React.SetStateAction<any[]>>;
  updateQuantity: (sku: string, delta: number) => void;
  user: any;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, closeCart, cart, setShoppingCart, updateQuantity, user }) => {
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [checkoutData, setCheckoutData] = useState({ nombre: '', direccion: '', telefono: '', pago: 'Efectivo' });

  useEffect(() => {
    if (user) setCheckoutData(prev => ({ ...prev, nombre: user.name || '' }));
  }, [user]);

  if (!isOpen) return null;

  const handleClose = () => {
    closeCart();
    setTimeout(() => setIsCheckoutStep(false), 300);
  };

  const cartTotal = cart.reduce((total, item) => total + (((item.product.isPromo ? item.product.promoPrice : item.product.unitPrice) ?? 0) * item.quantity), 0);
  
  const whatsappText = `Hola SUL Congelados, quiero confirmar este pedido:\n\n${cart.map(i => `• ${i.quantity}x ${i.product.name} ($${formatPrice(((i.product.isPromo ? i.product.promoPrice : i.product.unitPrice) ?? 0) * i.quantity)})`).join('\n')}\n\n*Total Neto: $${formatPrice(cartTotal)}*\n\n*Mis Datos:*\n👤 Nombre: ${checkoutData.nombre || 'No especificado'}\n📍 Dirección: ${checkoutData.direccion || 'Acordar con el vendedor'}\n📞 Teléfono: ${checkoutData.telefono || 'No especificado'}\n💳 Medio de Pago: ${checkoutData.pago}`;
  const WHATSAPP_NUMBER = "5493510000000"; 
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md bg-white h-dvh shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center">
            {isCheckoutStep && <button onClick={() => setIsCheckoutStep(false)} className="mr-3 text-slate-500 hover:text-slate-900 cursor-pointer"><ChevronLeft size={20} /></button>}
            <h2 className="text-lg font-black uppercase text-slate-900 flex items-center">
              <CartIcon size={20} className="mr-2"/> {isCheckoutStep ? 'Datos de Entrega' : 'Tu Pedido'}
            </h2>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-500 hover:text-slate-900 bg-slate-200 rounded-full cursor-pointer"><X size={18} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {!isCheckoutStep ? (
            <div className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-slate-400 mt-10"><CartIcon size={48} className="mx-auto mb-4 opacity-20"/> <p>Tu carrito está vacío.</p></div>
              ) : (
                cart.map(item => (
                  <div key={item.product.sku} className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900">{item.product.name}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <button onClick={() => updateQuantity(item.product.sku, -1)} className="w-6 h-6 flex items-center justify-center bg-slate-200 rounded-md text-slate-700 font-bold hover:bg-slate-300 cursor-pointer">-</button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.sku, 1)} className="w-6 h-6 flex items-center justify-center bg-slate-200 rounded-md text-slate-700 font-bold hover:bg-slate-300 cursor-pointer">+</button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-2">
                      <span className="font-black text-sm">${formatPrice(((item.product.isPromo ? item.product.promoPrice : item.product.unitPrice) ?? 0) * item.quantity)}</span>
                      <button onClick={() => setShoppingCart(cart.filter(i => i.product.sku !== item.product.sku))} className="text-red-400 hover:text-red-600 cursor-pointer p-1"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mb-4">
                <p className="text-xs text-blue-800 font-medium">Completá estos datos para procesar tu pedido por WhatsApp.</p>
              </div>
              <div><label className="flex items-center text-xs font-black text-slate-700 uppercase mb-1"><User size={14} className="mr-1"/> Nombre o Razón Social</label><input type="text" value={checkoutData.nombre} onChange={e => setCheckoutData({...checkoutData, nombre: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" /></div>
              <div><label className="flex items-center text-xs font-black text-slate-700 uppercase mb-1"><MapPin size={14} className="mr-1"/> Dirección de Entrega</label><input type="text" value={checkoutData.direccion} onChange={e => setCheckoutData({...checkoutData, direccion: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" /></div>
              <div><label className="flex items-center text-xs font-black text-slate-700 uppercase mb-1">📞 Teléfono / WhatsApp</label><input type="text" value={checkoutData.telefono} onChange={e => setCheckoutData({...checkoutData, telefono: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" /></div>
              <div><label className="flex items-center text-xs font-black text-slate-700 uppercase mb-1"><CreditCard size={14} className="mr-1"/> Forma de Pago</label><select value={checkoutData.pago} onChange={e => setCheckoutData({...checkoutData, pago: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"><option value="Efectivo">Efectivo contra entrega</option><option value="Transferencia">Transferencia Bancaria</option><option value="A Convenir">A convenir con el vendedor</option></select></div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
            <div className="flex justify-between items-center mb-4"><span className="font-bold text-slate-600">Total Neto:</span><span className="text-xl font-black text-slate-900">${formatPrice(cartTotal)}</span></div>
            {!isCheckoutStep ? (
              <div className="space-y-3">
                <button onClick={() => setIsCheckoutStep(true)} className="w-full bg-[#003366] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-900 transition cursor-pointer">Continuar con el Pedido</button>
                <button onClick={() => setShoppingCart([])} className="w-full bg-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-300 transition cursor-pointer flex items-center justify-center"><Trash2 size={16} className="mr-2" /> Vaciar Carrito</button>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in duration-300">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={handleClose} className="w-full bg-[#25D366] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#128C7E] transition cursor-pointer flex items-center justify-center"><MessageCircle size={20} className="mr-2" /> Enviar por WhatsApp</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};