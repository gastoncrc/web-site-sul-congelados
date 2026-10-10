import React, { useState, useEffect } from 'react';
import { X, ShoppingCart as CartIcon, Trash2, MessageCircle, MapPin, CreditCard, ChevronLeft, AlertTriangle, FileText } from 'lucide-react';
import { formatPrice } from '../../utils/currency';
import type { Product } from '../types';
import { CalendarGrid } from './cart/CalendarGrid';
import { CartLineItem } from './cart/CartLineItem';

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
  const [whatsappNumber, setWhatsappNumber] = useState("5493510000000");

  const [checkoutData, setCheckoutData] = useState({ 
    nombre: '', direccion: '', telefono: '', pago: 'Efectivo',
    tipoEntrega: 'Envio', fechaEntrega: '', observaciones: '' 
  });

  // Estado para controlar el mes del calendario interno
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  useEffect(() => {
    // Fetch mínimo de compra B2C y WhatsApp desde los ajustes reales del backend
    const fetchSettings = async () => {
      try {
        const { api } = await import('../config/api');
        const response = await api.get('/settings');
        if (response.data.min_purchase_b2c) setMinPurchaseB2C(Number(response.data.min_purchase_b2c));
        if (response.data.whatsapp_number) setWhatsappNumber(response.data.whatsapp_number);
      } catch (e) { console.error('Error al cargar WhatsApp:', e); }
    };
    if (isOpen) fetchSettings();
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

  const handleSubmitConfirmacion = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación extra para cliente fijo
    if (user && !checkoutData.fechaEntrega) {
      alert("Por favor, seleccioná una fecha de entrega en el calendario.");
      return;
    }

    try {
      // 🚀 NUEVO: Guardar en el Historial del Backend antes de ir a WhatsApp
      const { api } = await import('../config/api');
      await api.post('/orders', {
        userId: user?.id,
        customerName: user ? user.name : checkoutData.nombre,
        customerEmail: user?.email,
        customerPhone: checkoutData.telefono,
        deliveryAddress: checkoutData.tipoEntrega === 'Envio' ? checkoutData.direccion : 'Retiro por Fábrica',
        deliveryType: checkoutData.tipoEntrega,
        deliveryDate: checkoutData.fechaEntrega,
        paymentMethod: checkoutData.pago,
        totalAmount: cartTotal,
        observations: checkoutData.observaciones,
        items: cart
      });

      const datosEntregaText = user 
        ? `*Datos de Franquicia:*\n👤 Cliente: ${user.name}\n📅 Fecha de Reparto Elegida: ${checkoutData.fechaEntrega}\n📝 Obs: ${checkoutData.observaciones || 'Ninguna'}`
        : `*Datos de Entrega Minorista:*\n👤 Nombre: ${checkoutData.nombre}\n🚚 Modalidad: ${checkoutData.tipoEntrega === 'Envio' ? 'Envío a Domicilio' : 'Retiro en Planta (Día hábil posterior)'}\n📍 Dirección: ${checkoutData.tipoEntrega === 'Envio' ? checkoutData.direccion : 'Retiro por Fábrica'}\n📞 Teléfono: ${checkoutData.telefono}\n💳 Pago: ${checkoutData.pago}\n📝 Obs: ${checkoutData.observaciones || 'Ninguna'}`;

      const whatsappText = `Hola SUL Congelados, quiero confirmar este pedido:\n\n${cart.map(i => `• ${i.quantity}x ${i.product.name} ($${formatPrice(((i.product.isPromo ? i.product.promoPrice : i.product.unitPrice) ?? 0) * i.quantity)})`).join('\n')}\n\n*Total Neto: $${formatPrice(cartTotal)}*\n\n${datosEntregaText}`;
      
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`;

      window.open(whatsappUrl, '_blank');
      setShoppingCart([]); // Vaciar carrito después de comprar
      handleClose();
    } catch (error) {
      console.error('Error al guardar el pedido:', error);
      alert('Hubo un problema al procesar tu pedido, pero podés enviarlo por WhatsApp igualmente.');
      
      // Intentar abrir WhatsApp igual para no perder la venta
      const datosEntregaText = user 
        ? `*Datos de Franquicia:*\n👤 Cliente: ${user.name}\n📅 Fecha de Reparto Elegida: ${checkoutData.fechaEntrega}\n📝 Obs: ${checkoutData.observaciones || 'Ninguna'}`
        : `*Datos de Entrega Minorista:*\n👤 Nombre: ${checkoutData.nombre}\n🚚 Modalidad: ${checkoutData.tipoEntrega === 'Envio' ? 'Envío a Domicilio' : 'Retiro en Planta (Día hábil posterior)'}\n📍 Dirección: ${checkoutData.tipoEntrega === 'Envio' ? checkoutData.direccion : 'Retiro por Fábrica'}\n📞 Teléfono: ${checkoutData.telefono}\n💳 Pago: ${checkoutData.pago}\n📝 Obs: ${checkoutData.observaciones || 'Ninguna'}`;

      const whatsappText = `Hola SUL Congelados, quiero confirmar este pedido:\n\n${cart.map(i => `• ${i.quantity}x ${i.product.name} ($${formatPrice(((i.product.isPromo ? i.product.promoPrice : i.product.unitPrice) ?? 0) * i.quantity)})`).join('\n')}\n\n*Total Neto: $${formatPrice(cartTotal)}*\n\n${datosEntregaText}`;
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`, '_blank');
      handleClose();
    }
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
      <div className="absolute inset-0 bg-neutral-dark/50 backdrop-blur-sm" onClick={handleClose} />

      <form onSubmit={handleSubmitConfirmacion} className="relative w-full max-w-md bg-paper h-dvh shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        <div className="p-4 border-b border-line flex justify-between items-center bg-bg shrink-0">
          <div className="flex items-center">
            {isCheckoutStep && <button type="button" onClick={() => setIsCheckoutStep(false)} className="mr-3 text-ink-soft hover:text-ink cursor-pointer"><ChevronLeft size={20} /></button>}
            <h2 className="text-lg font-black uppercase text-ink flex items-center font-heading">
              <CartIcon size={20} className="mr-2"/> {isCheckoutStep ? (user ? 'Calendario de Reparto' : 'Datos de Entrega') : 'Tu Pedido'}
            </h2>
          </div>
          <button type="button" onClick={handleClose} className="p-2 text-ink-soft hover:text-ink bg-line rounded-full cursor-pointer"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!isCheckoutStep ? (
            /* 🛒 PASO 1: RESUMEN DE ARTÍCULOS */
            <div className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-ink-soft mt-10"><CartIcon size={48} className="mx-auto mb-4 opacity-20"/> <p>Tu carrito está vacío.</p></div>
              ) : (
                cart.map(item => (
                  <CartLineItem
                    key={item.product.sku}
                    product={item.product}
                    quantity={item.quantity}
                    onDecrement={() => updateQuantity(item.product.sku, -1)}
                    onIncrement={() => updateQuantity(item.product.sku, 1)}
                    onRemove={() => setShoppingCart(cart.filter(i => i.product.sku !== item.product.sku))}
                  />
                ))
              )}
            </div>
          ) : user ? (
            /* 📅 CLIENTE REGISTRADO: ALMANAQUE CON BLOQUEO ACTIVO DE DÍAS */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-brand-primary text-white p-4 rounded-card">
                <p className="text-xs font-bold text-brand-gold uppercase tracking-wider mb-1">Franquicia: {user.name}</p>
                <p className="text-[11px] text-white/70">Tus días de reparto asignados son: <strong className="text-white">{diasHabilitados.join(', ')}</strong>. Seleccioná una fecha activa del almanaque:</p>
              </div>

              <CalendarGrid
                monthLabel={`${nombreMeses[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`}
                celdasMes={celdasMes}
                diasNombresCortos={diasNombresCortos}
                diasSemanaMapa={diasSemanaMapa}
                diasHabilitados={diasHabilitados}
                hoy={hoy}
                fechaEntregaSeleccionada={checkoutData.fechaEntrega}
                onSelectFecha={(fecha) => setCheckoutData({...checkoutData, fechaEntrega: fecha})}
                onPrevMonth={() => cambiarMes(-1)}
                onNextMonth={() => cambiarMes(1)}
              />

              {checkoutData.fechaEntrega && (
                <div className="p-3 bg-success/10 border border-success/30 rounded-xl text-xs font-bold text-success">
                  📍 Fecha confirmada: {checkoutData.fechaEntrega}
                </div>
              )}

              <div>
                <label className="flex text-xs font-black text-ink-soft uppercase mb-2"><FileText size={14} className="mr-1"/> Observaciones (Opcional)</label>
                <textarea rows={3} value={checkoutData.observaciones} onChange={e => setCheckoutData({...checkoutData, observaciones: e.target.value})} className="w-full p-3 border border-line rounded-xl bg-bg text-sm outline-none focus:border-brand-gold" placeholder="Ej: Entregar por la mañana..."></textarea>
              </div>
            </div>
          ) : (
            /* 📝 CONSUMIDOR FINAL (TODOS LOS INPUTS REQUIRED) */
            <div className="space-y-4 animate-in fade-in duration-200">
              {debaRetirarEnPlanta ? (
                <div className="bg-warning/10 p-4 rounded-xl border border-warning/30 text-warning flex flex-col space-y-2">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5 text-warning" />
                    <div className="text-xs font-medium">
                      <p className="font-bold uppercase tracking-wider text-[10px] text-warning mb-1">Retiro en Planta Obligatorio</p>
                      Tu pedido no alcanza los <span className="font-bold">${formatPrice(minPurchaseB2C)}</span> para envío. Falta agregar <span className="font-bold">${formatPrice(faltanteEnvio)}</span>. **Se retira por fábrica el día hábil posterior**.
                    </div>
                  </div>
                  <div className="w-full bg-warning/20 rounded-full h-1.5 mt-2">
                    <div className="bg-warning h-1.5 rounded-full transition-all" style={{ width: `${(cartTotal / minPurchaseB2C) * 100}%` }}></div>
                  </div>
                </div>
              ) : (
                <div className="bg-success/10 p-3 rounded-xl border border-success/30 text-success text-xs font-medium">
                  🎉 ¡Superaste el mínimo de ${formatPrice(minPurchaseB2C)}! Habilitamos el envío a domicilio sin cargo.
                </div>
              )}

              <div><label className="block text-xs font-black text-ink-soft uppercase mb-1">Nombre Completo *</label><input type="text" required value={checkoutData.nombre} onChange={e => setCheckoutData({...checkoutData, nombre: e.target.value})} className="w-full p-3 border border-line rounded-xl bg-bg text-sm outline-none focus:border-brand-gold" placeholder="Nombre y Apellido" /></div>

              {!debaRetirarEnPlanta && (
                <div><label className="block text-xs font-black text-ink-soft uppercase mb-1"><MapPin size={12} className="inline mr-1"/> Dirección de Entrega *</label><input type="text" required value={checkoutData.direccion} onChange={e => setCheckoutData({...checkoutData, direccion: e.target.value})} className="w-full p-3 border border-line rounded-xl bg-bg text-sm outline-none focus:border-brand-gold" placeholder="Calle, Número, Barrio" /></div>
              )}

              <div><label className="block text-xs font-black text-ink-soft uppercase mb-1">Teléfono de Contacto *</label><input type="text" required value={checkoutData.telefono} onChange={e => setCheckoutData({...checkoutData, telefono: e.target.value})} className="w-full p-3 border border-line rounded-xl bg-bg text-sm outline-none focus:border-brand-gold" placeholder="Ej: 351555555" /></div>
              <div><label className="block text-xs font-black text-ink-soft uppercase mb-1"><CreditCard size={12} className="inline mr-1"/> Forma de Pago *</label><select required value={checkoutData.pago} onChange={e => setCheckoutData({...checkoutData, pago: e.target.value})} className="w-full p-3 border border-line rounded-xl bg-bg text-sm outline-none focus:border-brand-gold"><option value="Efectivo">Efectivo contra entrega</option><option value="Transferencia">Transferencia Bancaria</option></select></div>
              <div><label className="block text-xs font-black text-ink-soft uppercase mb-1">Observaciones / Aclaraciones</label><textarea rows={2} value={checkoutData.observaciones} onChange={e => setCheckoutData({...checkoutData, observaciones: e.target.value})} className="w-full p-3 border border-line rounded-xl bg-bg text-sm outline-none focus:border-brand-gold" placeholder="Notas para la entrega..." /></div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-line bg-bg shrink-0">
            <div className="flex justify-between items-center mb-4"><span className="font-bold text-ink-soft">Total Neto:</span><span className="text-xl font-black text-ink">${formatPrice(cartTotal)}</span></div>
            {!isCheckoutStep ? (
              <div className="space-y-3">
                <button type="button" onClick={() => setIsCheckoutStep(true)} className="w-full bg-brand-primary text-brand-primary-on font-bold py-4 rounded-xl shadow-lg hover:bg-brand-accent transition cursor-pointer">Continuar con el Pedido</button>
                <button type="button" onClick={() => setShoppingCart([])} className="w-full bg-line text-ink-soft font-bold py-3 rounded-xl hover:bg-ink-soft/20 transition cursor-pointer flex items-center justify-center"><Trash2 size={16} className="mr-2" /> Vaciar Carrito</button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* WhatsApp brand green — not a theme token, intentional */}
                <button type="submit" className="w-full bg-whatsapp text-white font-bold py-4 rounded-xl shadow-lg hover:bg-whatsapp-deep transition cursor-pointer flex items-center justify-center">
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