import React, { useState, useEffect } from 'react';
import { X, ShoppingCart as CartIcon, Trash2, MessageCircle, MapPin, CreditCard, ChevronLeft, AlertTriangle, FileText, ChevronRight } from 'lucide-react';
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
  const [minPurchaseB2C, setMinPurchaseB2C] = useState(30000); 

  const [checkoutData, setCheckoutData] = useState({ 
    nombre: '', direccion: '', telefono: '', pago: 'Efectivo',
    tipoEntrega: 'Envio', fechaEntrega: '', observaciones: '' 
  });

  // Estado para controlar el mes del calendario interno
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  useEffect(() => {
    const savedMin = localStorage.getItem('sul_min_purchase_b2c');
    if (savedMin) setMinPurchaseB2C(Number(savedMin));
  }, [isOpen]);

  const diasHabilitados = user?.dias_entrega 
    ? (typeof user.dias_entrega === 'string' ? user.dias_entrega.split(',') : user.dias_entrega)
    : ['Martes', 'Viernes'];

  const cartTotal = cart.reduce((total, item) => total + (((item.product.isPromo ? item.product.promoPrice : item.product.unitPrice) ?? 0) * item.quantity), 0);
  const faltanteEnvio = minPurchaseB2C - cartTotal;
  const debaRetirarEnPlanta = !user && faltanteEnvio > 0;

  useEffect(() => {
    if (user) {
      setCheckoutData(prev => ({ ...prev, nombre: user.name || '', tipoEntrega: 'Envio', fechaEntrega: '' }));
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

  const handleSubmitConfirmacion = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación extra para cliente fijo
    if (user && !checkoutData.fechaEntrega) {
      alert("Por favor, seleccioná una fecha de entrega en el calendario.");
      return;
    }

    const datosEntregaText = user 
      ? `*Datos de Franquicia:*\n👤 Cliente: ${user.name}\n📅 Fecha de Reparto Elegida: ${checkoutData.fechaEntrega}\n📝 Obs: ${checkoutData.observaciones || 'Ninguna'}`
      : `*Datos de Entrega Minorista:*\n👤 Nombre: ${checkoutData.nombre}\n🚚 Modalidad: ${checkoutData.tipoEntrega === 'Envio' ? 'Envío a Domicilio' : 'Retiro en Planta (Día hábil posterior)'}\n📍 Dirección: ${checkoutData.tipoEntrega === 'Envio' ? checkoutData.direccion : 'Retiro por Fábrica'}\n📞 Teléfono: ${checkoutData.telefono}\n💳 Pago: ${checkoutData.pago}\n📝 Obs: ${checkoutData.observaciones || 'Ninguna'}`;

    const whatsappText = `Hola SUL Congelados, quiero confirmar este pedido:\n\n${cart.map(i => `• ${i.quantity}x ${i.product.name} ($${formatPrice(((i.product.isPromo ? i.product.promoPrice : i.product.unitPrice) ?? 0) * i.quantity)})`).join('\n')}\n\n*Total Neto: $${formatPrice(cartTotal)}*\n\n${datosEntregaText}`;
    
    const WHATSAPP_NUMBER = "5493510000000"; 
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

    window.open(whatsappUrl, '_blank');
    handleClose();
  };

  /* 🚀 LÓGICA DEL CALENDARIO COMPACTO EN CUADRÍCULA */
  const generarDiasCalendario = () => {
    const año = currentCalendarDate.getFullYear();
    const mes = currentCalendarDate.getMonth();
    
    const primerDiaMes = new Date(año, mes, 1).getDay();
    const totalDiasMes = new Date(año, mes + 1, 0).getDate();
    
    const celdas = [];
    // Rellenar días vacíos del principio de la semana (ajustado para que empiece en Lunes o Domingo según corresponda)
    for (let i = 0; i < primerDiaMes; i++) {
      celdas.push(null);
    }
    // Rellenar los días del mes
    for (let d = 1; d <= totalDiasMes; d++) {
      celdas.push(new Date(año, mes, d));
    }
    return celdas;
  };

  const nombreMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const diasNombresCortos = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const diasSemanaMapa = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const cambiarMes = (direccion: number) => {
    const nuevaFecha = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + direccion, 1);
    setCurrentCalendarDate(nuevaFecha);
  };

  const celdasMes = generarDiasCalendario();
  const hoy = new Date();
  hoy.setHours(0,0,0,0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} />
      
      <form onSubmit={handleSubmitConfirmacion} className="relative w-full max-w-md bg-white h-dvh shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center">
            {isCheckoutStep && <button type="button" onClick={() => setIsCheckoutStep(false)} className="mr-3 text-slate-500 hover:text-slate-900 cursor-pointer"><ChevronLeft size={20} /></button>}
            <h2 className="text-lg font-black uppercase text-slate-900 flex items-center">
              <CartIcon size={20} className="mr-2"/> {isCheckoutStep ? (user ? 'Calendario de Reparto' : 'Datos de Entrega') : 'Tu Pedido'}
            </h2>
          </div>
          <button type="button" onClick={handleClose} className="p-2 text-slate-500 hover:text-slate-900 bg-slate-200 rounded-full cursor-pointer"><X size={18} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {!isCheckoutStep ? (
            /* 🛒 PASO 1: RESUMEN DE ARTÍCULOS */
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
            /* 📅 CLIENTE REGISTRADO: ALMANAQUE CON BLOQUEO ACTIVO DE DÍAS */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800">
                <p className="text-xs font-bold text-[#deff9a] uppercase tracking-wider mb-1">Franquicia: {user.name}</p>
                <p className="text-[11px] text-slate-400">Tus días de reparto asignados son: <strong className="text-white">{diasHabilitados.join(', ')}</strong>. Seleccioná una fecha activa del almanaque:</p>
              </div>

              {/* INTERFAZ DEL ALMANAQUE EN CUADRÍCULA */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <button type="button" onClick={() => cambiarMes(-1)} className="p-1.5 border rounded-lg hover:bg-slate-50 cursor-pointer"><ChevronLeft size={16}/></button>
                  <span className="font-black text-sm text-slate-900 uppercase tracking-wider">{nombreMeses[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}</span>
                  <button type="button" onClick={() => cambiarMes(1)} className="p-1.5 border rounded-lg hover:bg-slate-50 cursor-pointer"><ChevronRight size={16}/></button>
                </div>

                {/* Encabezado Días Cortos */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {diasNombresCortos.map(n => <span key={n} className="text-[10px] font-black uppercase text-slate-400 py-1">{n}</span>)}
                </div>

                {/* Grilla Numérica */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {celdasMes.map((fechaCell, idx) => {
                    if (!fechaCell) return <div key={`empty-${idx}`} />;

                    const nombreDiaSemana = diasSemanaMapa[fechaCell.getDay()];
                    const esDiaPermitido = diasHabilitados.includes(nombreDiaSemana);
                    const esPasado = fechaCell < hoy;
                    const puedePedir = esDiaPermitido && !esPasado;

                    const diaNumero = fechaCell.getDate();
                    const fechaStringFormato = `${nombreDiaSemana} ${String(diaNumero).padStart(2,'0')}/${String(fechaCell.getMonth()+1).padStart(2,'0')}`;
                    const esSeleccionado = checkoutData.fechaEntrega === fechaStringFormato;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!puedePedir}
                        onClick={() => setCheckoutData({...checkoutData, fechaEntrega: fechaStringFormato})}
                        className={`h-9 w-full rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                          esSeleccionado ? 'bg-slate-900 text-[#deff9a] font-black ring-2 ring-slate-900' :
                          puedePedir ? 'bg-green-50 text-green-800 border border-green-200 hover:bg-green-100 cursor-pointer' :
                          'bg-slate-50 text-slate-300 opacity-30 cursor-not-allowed'
                        }`}
                      >
                        {diaNumero}
                      </button>
                    );
                  })}
                </div>
              </div>

              {checkoutData.fechaEntrega && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-800">
                  📍 Fecha confirmada: {checkoutData.fechaEntrega}
                </div>
              )}

              <div>
                <label className="flex text-xs font-black text-slate-700 uppercase mb-2"><FileText size={14} className="mr-1"/> Observaciones (Opcional)</label>
                <textarea rows={3} value={checkoutData.observaciones} onChange={e => setCheckoutData({...checkoutData, observaciones: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900" placeholder="Ej: Entregar por la mañana..."></textarea>
              </div>
            </div>
          ) : (
            /* 📝 CONSUMIDOR FINAL (TODOS LOS INPUTS REQUIRED) */
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
              
              <div><label className="block text-xs font-black text-slate-700 uppercase mb-1">Nombre Completo *</label><input type="text" required value={checkoutData.nombre} onChange={e => setCheckoutData({...checkoutData, nombre: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900" placeholder="Nombre y Apellido" /></div>
              
              {!debaRetirarEnPlanta && (
                <div><label className="block text-xs font-black text-slate-700 uppercase mb-1"><MapPin size={12} className="inline mr-1"/> Dirección de Entrega *</label><input type="text" required value={checkoutData.direccion} onChange={e => setCheckoutData({...checkoutData, direccion: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900" placeholder="Calle, Número, Barrio" /></div>
              )}

              <div><label className="block text-xs font-black text-slate-700 uppercase mb-1">Teléfono de Contacto *</label><input type="text" required value={checkoutData.telefono} onChange={e => setCheckoutData({...checkoutData, telefono: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900" placeholder="Ej: 351555555" /></div>
              <div><label className="block text-xs font-black text-slate-700 uppercase mb-1"><CreditCard size={12} className="inline mr-1"/> Forma de Pago *</label><select required value={checkoutData.pago} onChange={e => setCheckoutData({...checkoutData, pago: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900"><option value="Efectivo">Efectivo contra entrega</option><option value="Transferencia">Transferencia Bancaria</option></select></div>
              <div><label className="block text-xs font-black text-slate-700 uppercase mb-1">Observaciones / Aclaraciones</label><textarea rows={2} value={checkoutData.observaciones} onChange={e => setCheckoutData({...checkoutData, observaciones: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900" placeholder="Notas para la entrega..." /></div>
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