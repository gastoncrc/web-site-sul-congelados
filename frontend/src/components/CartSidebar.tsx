import React, { useState, useEffect } from 'react';
import { X, ShoppingCart as CartIcon, Trash2, MessageCircle, MapPin, CreditCard, ChevronLeft, Calendar, Info } from 'lucide-react';
import { formatPrice } from '../../utils/currency';
import type { Product } from '../types';

interface CartProduct extends Product {
  isPromo?: boolean;
  promoPrice?: number;
  unitPrice: number;
  inSlider?: boolean; 
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
  const [minPurchaseB2C, setMinPurchaseB2C] = useState(30000); // Valor inicial por defecto

  const [checkoutData, setCheckoutData] = useState({ 
    nombre: '', 
    direccion: '', 
    telefono: '', 
    pago: 'Efectivo',
    tipoEntrega: 'Envio', // 'Envio' o 'Retiro'
    diaEntrega: '' 
  });

  // Cargar el mínimo de compra configurado en el Admin
  useEffect(() => {
    const savedMin = localStorage.getItem('sul_min_purchase_b2c');
    if (savedMin) setMinPurchaseB2C(Number(savedMin));
  }, [isOpen]);

  // Días habilitados guardados en el usuario (viene en formato string "Martes,Viernes" o array)
  const diasHabilitados = user?.dias_entrega 
    ? (typeof user.dias_entrega === 'string' ? user.dias_entrega.split(',') : user.dias_entrega)
    : ['Martes', 'Viernes'];

  const cartTotal = cart.reduce((total, item) => total + (((item.product.isPromo ? item.product.promoPrice : item.product.unitPrice) ?? 0) * item.quantity), 0);
  const alcanzaMinimoB2C = cartTotal >= minPurchaseB2C;

  // Forzar retiro en planta si no es usuario registrado y no llega al mínimo
  const debaRetirarEnPlanta = !user && !alcanzaMinimoB2C;

  useEffect(() => {
    if (user) {
      setCheckoutData(prev => ({ 
        ...prev, 
        nombre: user.name || '',
        diaEntrega: diasHabilitados[0] || 'Martes'
      }));
    } else if (debaRetirarEnPlanta) {
      setCheckoutData(prev => ({ ...prev, tipoEntrega: 'Retiro' }));
    } else {
      setCheckoutData(prev => ({ ...prev, tipoEntrega: 'Envio' }));
    }
  }, [user, debaRetirarEnPlanta, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    closeCart();
    setTimeout(() => setIsCheckoutStep(false), 300);
  };

  // Construcción del mensaje de WhatsApp estructurado
  const datosEntregaText = user 
    ? `*Datos de Franquicia:*\n👤 Cliente: ${user.name}\n💼 Convenio: ${user.convenio || 'General'}\n📅 Día de Entrega Elegido: ${checkoutData.diaEntrega}`
    : `*Datos de Entrega Minorista:*\n👤 Nombre: ${checkoutData.nombre || 'No especificado'}\n🚚 Modalidad: ${checkoutData.tipoEntrega === 'Envio' ? 'Envío a Domicilio' : 'Retiro en Planta (Día hábil posterior)'}\n📍 Dirección: ${checkoutData.tipoEntrega === 'Envio' ? checkoutData.direccion : 'Retiro por Fábrica'}\n📞 Teléfono: ${checkoutData.telefono || 'No especificado'}\n💳 Pago: ${checkoutData.pago}`;

  const whatsappText = `Hola SUL Congelados, quiero confirmar este pedido:\n\n${cart.map(i => `• ${i.quantity}x ${i.product.name} ($${formatPrice(((i.product.isPromo ? i.product.promoPrice : i.product.unitPrice) ?? 0) * i.quantity)})`).join('\n')}\n\n*Total Neto: $${formatPrice(cartTotal)}*\n\n${datosEntregaText}`;
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
              <CartIcon size={20} className="mr-2"/> {isCheckoutStep ? (user ? 'Programar Reparto' : 'Datos de Entrega') : 'Tu Pedido'}
            </h2>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-500 hover:text-slate-900 bg-slate-200 rounded-full cursor-pointer"><X size={18} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {!isCheckoutStep ? (
            /* 🛒 PASO 1: LISTA DE ARTÍCULOS */
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
          ) : user ? (
            /* 📅 PASO 2 (A): CLIENTE FIJO -> ASIGNACIÓN DE DÍA */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800">
                <p className="text-xs font-bold text-[#deff9a] uppercase tracking-wider mb-1">Franquicia: {user.name}</p>
                <p className="text-[11px] text-slate-400">Seleccioná cuál de tus días asignados preferís recibir la mercadería.</p>
              </div>

              <div>
                <label className="flex items-center text-xs font-black text-slate-700 uppercase mb-3">
                  <Calendar size={14} className="mr-1 text-blue-600"/> Días de Reparto Habilitados
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {diasHabilitados.map((dia: string) => (
                    <label key={dia} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${checkoutData.diaEntrega === dia ? 'border-slate-900 bg-slate-50 font-bold text-slate-900' : 'border-slate-200 bg-white text-slate-600'}`}>
                      <span className="text-sm uppercase tracking-wider">Entregar el día {dia}</span>
                      <input type="radio" name="diaEntrega" value={dia} checked={checkoutData.diaEntrega === dia} onChange={e => setCheckoutData({...checkoutData, diaEntrega: e.target.value})} className="w-4 h-4 text-slate-900 focus:ring-slate-900 cursor-pointer" />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* 📝 PASO 2 (B): CONSUMIDOR FINAL -> VALIDACIÓN DE MÍNIMO */
            <div className="space-y-4 animate-in fade-in duration-200">
              {debaRetirarEnPlanta ? (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 flex items-start space-x-2">
                  <Info size={18} className="shrink-0 mt-0.5 text-amber-600" />
                  <div className="text-xs font-medium">
                    <p className="font-bold uppercase tracking-wider text-[10px] text-amber-700 mb-1">Aviso de Compra Mínima</p>
                    Tu pedido es menor a <span className="font-bold">${formatPrice(minPurchaseB2C)}</span>. No califica para envío logístico. **Se retira por planta obligatoriamente el día hábil posterior**.
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 p-3 rounded-xl border border-green-200 text-green-900 text-xs font-medium">
                  🎉 ¡Excelente! Superaste el mínimo de ${formatPrice(minPurchaseB2C)}. Tu pedido califica para envío a domicilio sin cargo.
                </div>
              )}
              
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">Nombre o Razón Social *</label>
                <input type="text" required value={checkoutData.nombre} onChange={e => setCheckoutData({...checkoutData, nombre: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" placeholder="Tu nombre" />
              </div>

              {!debaRetirarEnPlanta && (
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1"><MapPin size={12} className="inline mr-1"/> Dirección de Entrega *</label>
                  <input type="text" required value={checkoutData.direccion} onChange={e => setCheckoutData({...checkoutData, direccion: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" placeholder="Calle, Número, Barrio" />
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1">Teléfono de Contacto *</label>
                <input type="text" required value={checkoutData.telefono} onChange={e => setCheckoutData({...checkoutData, telefono: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" placeholder="Ej: 351..." />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1"><CreditCard size={12} className="inline mr-1"/> Forma de Pago</label>
                <select value={checkoutData.pago} onChange={e => setCheckoutData({...checkoutData, pago: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"><option value="Efectivo">Efectivo contra entrega</option><option value="Transferencia">Transferencia Bancaria</option></select>
              </div>
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
              <div className="space-y-3">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={handleClose} className="w-full bg-[#25D366] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#128C7E] transition cursor-pointer flex items-center justify-center">
                  <MessageCircle size={20} className="mr-2" />
                  {debaRetirarEnPlanta ? 'Confirmar Retiro por Planta' : 'Enviar por WhatsApp'}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};