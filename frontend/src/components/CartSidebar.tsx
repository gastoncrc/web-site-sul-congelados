import React, { useState, useEffect, useMemo } from 'react';
import { X, ShoppingCart as CartIcon, Trash2, MessageCircle, MapPin, CreditCard, ChevronLeft, Calendar, AlertTriangle, FileText } from 'lucide-react';
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

// 🚀 HELPER: Calcula automáticamente las próximas fechas exactas según los días permitidos
const generarProximasFechas = (diasHabilitados: string[]) => {
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const indicesHabilitados = diasHabilitados.map(d => diasSemana.indexOf(d)).filter(i => i !== -1);
  
  if (indicesHabilitados.length === 0) return [];

  const fechasValidas = [];
  let fechaActual = new Date();
  fechaActual.setDate(fechaActual.getDate() + 1); // Calculamos entregas a partir de mañana

  // Buscamos las próximas 5 fechas que coincidan con sus días habilitados
  while (fechasValidas.length < 5) {
    if (indicesHabilitados.includes(fechaActual.getDay())) {
      fechasValidas.push(new Date(fechaActual));
    }
    fechaActual.setDate(fechaActual.getDate() + 1);
  }
  return fechasValidas;
};

const formatearFecha = (date: Date) => {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const diaNombre = dias[date.getDay()];
  const diaNumero = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  return {
    completo: `${diaNombre} ${diaNumero}/${mes}`,
    valor: date.toISOString().split('T')[0] // Formato YYYY-MM-DD para guardar
  };
};

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, closeCart, cart, setShoppingCart, updateQuantity, user }) => {
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [minPurchaseB2C, setMinPurchaseB2C] = useState(30000); 

  const [checkoutData, setCheckoutData] = useState({ 
    nombre: '', direccion: '', telefono: '', pago: 'Efectivo',
    tipoEntrega: 'Envio', fechaEntrega: '', observaciones: '' 
  });

  useEffect(() => {
    const savedMin = localStorage.getItem('sul_min_purchase_b2c');
    if (savedMin) setMinPurchaseB2C(Number(savedMin));
  }, [isOpen]);

  const diasHabilitados = user?.dias_entrega 
    ? (typeof user.dias_entrega === 'string' ? user.dias_entrega.split(',') : user.dias_entrega)
    : ['Martes', 'Viernes'];

  // Calculamos las opciones de fechas solo una vez o cuando cambie el usuario
  const opcionesFechas = useMemo(() => generarProximasFechas(diasHabilitados), [user]);

  const cartTotal = cart.reduce((total, item) => total + (((item.product.isPromo ? item.product.promoPrice : item.product.unitPrice) ?? 0) * item.quantity), 0);
  const faltanteEnvio = minPurchaseB2C - cartTotal;
  const debaRetirarEnPlanta = !user && faltanteEnvio > 0;

  useEffect(() => {
    if (user) {
      setCheckoutData(prev => ({ 
        ...prev, 
        nombre: user.name || '', 
        // Pre-seleccionamos la primera fecha disponible calculada
        fechaEntrega: opcionesFechas.length > 0 ? formatearFecha(opcionesFechas[0]).completo : '',
        tipoEntrega: 'Envio'
      }));
    } else if (debaRetirarEnPlanta) {
      setCheckoutData(prev => ({ ...prev, tipoEntrega: 'Retiro' }));
    } else {
      setCheckoutData(prev => ({ ...prev, tipoEntrega: 'Envio' }));
    }
  }, [user, debaRetirarEnPlanta, isOpen, opcionesFechas]);

  if (!isOpen) return null;

  const handleClose = () => {
    closeCart();
    setTimeout(() => setIsCheckoutStep(false), 300);
  };

  // 🚀 INTERCEPTAMOS EL FORMULARIO NATIVO PARA OBLIGAR A LLENAR LOS DATOS
  const handleSubmitConfirmacion = (e: React.FormEvent) => {
    e.preventDefault();

    const datosEntregaText = user 
      ? `*Datos de Franquicia:*\n👤 Cliente: ${user.name}\n📅 Fecha de Reparto: ${checkoutData.fechaEntrega}\n📝 Obs: ${checkoutData.observaciones || 'Ninguna'}`
      : `*Datos de Entrega Minorista:*\n👤 Nombre: ${checkoutData.nombre}\n🚚 Modalidad: ${checkoutData.tipoEntrega === 'Envio' ? 'Envío a Domicilio' : 'Retiro en Planta (Día hábil posterior)'}\n📍 Dirección: ${checkoutData.tipoEntrega === 'Envio' ? checkoutData.direccion : 'Retiro por Fábrica'}\n📞 Teléfono: ${checkoutData.telefono}\n💳 Pago: ${checkoutData.pago}\n📝 Obs: ${checkoutData.observaciones || 'Ninguna'}`;

    const whatsappText = `Hola SUL Congelados, quiero confirmar este pedido:\n\n${cart.map(i => `• ${i.quantity}x ${i.product.name} ($${formatPrice(((i.product.isPromo ? i.product.promoPrice : i.product.unitPrice) ?? 0) * i.quantity)})`).join('\n')}\n\n*Total Neto: $${formatPrice(cartTotal)}*\n\n${datosEntregaText}`;
    
    const WHATSAPP_NUMBER = "5493510000000"; 
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

    window.open(whatsappUrl, '_blank');
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} />
      
      {/* 🚀 EL CONTENEDOR AHORA ES UN FORMULARIO COMPLETO */}
      <form onSubmit={handleSubmitConfirmacion} className="relative w-full max-w-md bg-white h-dvh shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center">
            {isCheckoutStep && <button type="button" onClick={() => setIsCheckoutStep(false)} className="mr-3 text-slate-500 hover:text-slate-900 cursor-pointer"><ChevronLeft size={20} /></button>}
            <h2 className="text-lg font-black uppercase text-slate-900 flex items-center">
              <CartIcon size={20} className="mr-2"/> {isCheckoutStep ? (user ? 'Programar Reparto' : 'Datos de Entrega') : 'Tu Pedido'}
            </h2>
          </div>
          <button type="button" onClick={handleClose} className="p-2 text-slate-500 hover:text-slate-900 bg-slate-200 rounded-full cursor-pointer"><X size={18} /></button>
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
                        <button type="button" onClick={() => updateQuantity(item.product.sku, -1)} className="w-6 h-6 flex items-center justify-center bg-slate-200 rounded-md text-slate-700 font-bold hover:bg-slate-300 cursor-pointer">-</button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.product.sku, 1)} className="w-6 h-6 flex items-center justify-center bg-slate-200 rounded-md text-slate-700 font-bold hover:bg-slate-300 cursor-pointer">+</button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-2">
                      <span className="font-black text-sm">${formatPrice(((item.product.isPromo ? item.product.promoPrice : item.product.unitPrice) ?? 0) * item.quantity)}</span>
                      <button type="button" onClick={() => setShoppingCart(cart.filter(i => i.product.sku !== item.product.sku))} className="text-red-400 hover:text-red-600 cursor-pointer p-1"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : user ? (
            /* 📅 CLIENTE REGISTRADO: SELECTOR DE FECHAS SEGURAS */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800">
                <p className="text-xs font-bold text-[#deff9a] uppercase tracking-wider mb-1">Franquicia: {user.name}</p>
                <p className="text-[11px] text-slate-400">Tus datos logísticos están validados. Seleccioná una de las fechas habilitadas para la recepción.</p>
              </div>

              <div>
                <label className="flex text-xs font-black text-slate-700 uppercase mb-3 items-center">
                  <Calendar size={14} className="mr-1 text-blue-600"/> Próximas Fechas Disponibles
                </label>
                
                <div className="grid grid-cols-1 gap-2">
                  {opcionesFechas.map((fecha, idx) => {
                    const objFecha = formatearFecha(fecha);
                    return (
                      <label key={idx} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${checkoutData.fechaEntrega === objFecha.completo ? 'border-slate-900 bg-slate-50 font-bold text-slate-900 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        <span className="text-sm uppercase tracking-wider">{objFecha.completo}</span>
                        <input 
                          type="radio" 
                          name="fechaExacta" 
                          value={objFecha.completo} 
                          required
                          checked={checkoutData.fechaEntrega === objFecha.completo} 
                          onChange={e => setCheckoutData({...checkoutData, fechaEntrega: e.target.value})} 
                          className="w-4 h-4 text-slate-900 focus:ring-slate-900 cursor-pointer" 
                        />
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="flex text-xs font-black text-slate-700 uppercase mb-2"><FileText size={14} className="mr-1"/> Observaciones (Opcional)</label>
                <textarea rows={3} value={checkoutData.observaciones} onChange={e => setCheckoutData({...checkoutData, observaciones: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900" placeholder="Ej: Dejar la mercadería en la cámara..."></textarea>
              </div>
            </div>
          ) : (
            /* 📝 CONSUMIDOR FINAL (CON DATOS OBLIGATORIOS) */
            <div className="space-y-4 animate-in fade-in duration-200">
              {debaRetirarEnPlanta ? (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 flex flex-col space-y-2">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600" />
                    <div className="text-xs font-medium">
                      <p className="font-bold uppercase tracking-wider text-[10px] text-amber-700 mb-1">Retiro en Planta Obligatorio</p>
                      Tu pedido no alcanza los <span className="font-bold">${formatPrice(minPurchaseB2C)}</span> para envío. Falta agregar <span className="font-bold">${formatPrice(faltanteEnvio)}</span>. **Se retira por fábrica el día hábil posterior**.
                    </div>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-1.5 mt-2">
                    <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${(cartTotal / minPurchaseB2C) * 100}%` }}></div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 p-3 rounded-xl border border-green-200 text-green-900 text-xs font-medium">
                  🎉 ¡Superaste el mínimo de ${formatPrice(minPurchaseB2C)}! Habilitamos el envío a domicilio sin cargo.
                </div>
              )}
              
              {/* 🚀 Atributo REQUIRED activo en los inputs */}
              <div><label className="block text-xs font-black text-slate-700 uppercase mb-1">Nombre Completo *</label><input type="text" required value={checkoutData.nombre} onChange={e => setCheckoutData({...checkoutData, nombre: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900" /></div>
              
              {!debaRetirarEnPlanta && (
                <div><label className="block text-xs font-black text-slate-700 uppercase mb-1"><MapPin size={12} className="inline mr-1"/> Dirección de Entrega *</label><input type="text" required value={checkoutData.direccion} onChange={e => setCheckoutData({...checkoutData, direccion: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900" placeholder="Calle, Número, Barrio" /></div>
              )}

              <div><label className="block text-xs font-black text-slate-700 uppercase mb-1">Teléfono de Contacto *</label><input type="text" required value={checkoutData.telefono} onChange={e => setCheckoutData({...checkoutData, telefono: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900" placeholder="Ej: 351..." /></div>
              <div><label className="block text-xs font-black text-slate-700 uppercase mb-1"><CreditCard size={12} className="inline mr-1"/> Forma de Pago *</label><select required value={checkoutData.pago} onChange={e => setCheckoutData({...checkoutData, pago: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900"><option value="Efectivo">Efectivo contra entrega</option><option value="Transferencia">Transferencia Bancaria</option></select></div>
              <div><label className="block text-xs font-black text-slate-700 uppercase mb-1">Observaciones / Aclaraciones</label><textarea rows={2} value={checkoutData.observaciones} onChange={e => setCheckoutData({...checkoutData, observaciones: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900" placeholder="Notas para la entrega..."></textarea></div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
            <div className="flex justify-between items-center mb-4"><span className="font-bold text-slate-600">Total Neto:</span><span className="text-xl font-black text-slate-900">${formatPrice(cartTotal)}</span></div>
            {!isCheckoutStep ? (
              <div className="space-y-3">
                <button type="button" onClick={() => setIsCheckoutStep(true)} className="w-full bg-[#003366] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-900 transition cursor-pointer">Continuar con el Pedido</button>
                <button type="button" onClick={() => setShoppingCart([])} className="w-full bg-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-300 transition cursor-pointer flex items-center justify-center"><Trash2 size={16} className="mr-2" /> Vaciar Carrito</button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 🚀 BOTÓN TIPO SUBMIT PARA FORZAR LA VALIDACIÓN HTML DE LOS CAMPOS */}
                <button type="submit" className="w-full bg-[#25D366] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#128C7E] transition cursor-pointer flex items-center justify-center">
                  <MessageCircle size={20} className="mr-2" />
                  {debaRetirarEnPlanta ? 'Confirmar Retiro por Planta' : 'Enviar por WhatsApp'}
                </button>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};