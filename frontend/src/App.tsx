import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './config/api';
import type { Product } from './types'; 
import { X, ShoppingCart as CartIcon, Trash2, MessageCircle } from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoginModal, ChangePasswordModal } from './components/Modals';

import { Catalog } from './pages/Catalog';
import { Admin } from './pages/Admin';
import { Nosotros } from './pages/Nosotros';
import { Contacto } from './pages/Contacto';
import { formatPrice } from './../utils/currency';

interface AppProduct extends Product {
  isPromo?: boolean;
  promoPrice?: number;
  unitPrice: number;
}

interface AppCartItem {
  product: AppProduct;
  quantity: number;
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

function MainLayout() {
  const { token, user } = useAuth();
  
  const [currentView, setCurrentView] = useState<'home' | 'nosotros' | 'contacto' | 'admin'>('home');
  const [catalogProducts, setCatalogProducts] = useState<AppProduct[]>([]);
  const [shoppingCart, setShoppingCart] = useState<AppCartItem[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true); 
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [systemMessage, setSystemMessage] = useState('');

  const fetchCatalogData = async () => {
    setIsCatalogLoading(true);
    try {
      const response = await api.get(`/products?t=${new Date().getTime()}`);
      setCatalogProducts(response.data);
    } catch (error) {
      setCatalogProducts([]); 
    } finally {
      setIsCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === 'home') {
      fetchCatalogData();
      setSystemMessage(''); 
    }
  }, [token, currentView]);

  useEffect(() => { if (!token) setIsPasswordModalOpen(false); }, [token]);

  if (user?.role === 'Admin') {
    return (
      <div className="fixed inset-0 h-dvh w-screen bg-[#0f172a] font-sans text-gray-800 overflow-hidden flex flex-col">
        {systemMessage && (
          <div className="absolute top-4 right-4 z-50 bg-blue-50 border-l-4 border-blue-600 p-4 rounded shadow-lg flex justify-between items-center min-w-75">
            <span className="text-sm font-medium text-blue-900">{systemMessage}</span>
            <button onClick={() => setSystemMessage('')} className="ml-4 text-blue-500 font-bold text-xs hover:underline cursor-pointer">X</button>
          </div>
        )}
        <Admin setSystemMessage={setSystemMessage} triggerDataRefresh={fetchCatalogData} />
      </div>
    );
  }

  const updateCartQuantity = (sku: string, delta: number) => {
    setShoppingCart(prev => prev.map(item => {
      if (item.product.sku === sku) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  // 🚀 VARIABLES PARA WHATSAPP
  const cartTotal = shoppingCart.reduce((total, item) => total + (((item.product.isPromo ? item.product.promoPrice : item.product.unitPrice) ?? 0) * item.quantity), 0);
  
  // Armamos el texto que se va a enviar por WhatsApp
  const whatsappText = `Hola SUL Congelados, quiero confirmar este pedido:\n\n${shoppingCart.map(i => `• ${i.quantity}x ${i.product.name} ($${formatPrice(((i.product.isPromo ? i.product.promoPrice : i.product.unitPrice) ?? 0) * i.quantity)})`).join('\n')}\n\n*Total Neto: $${formatPrice(cartTotal)}*`;
  
  // Reemplazá este número por el de tu negocio (54 = Argentina, 9 = Celular, sin el 15)
  const WHATSAPP_NUMBER = "5493515166974"; 
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800 overflow-x-hidden relative">
      <Header 
        currentTab={currentView} setCurrentTab={setCurrentView} 
        openLogin={() => setIsLoginModalOpen(true)} 
        cartCount={shoppingCart.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)} 
      />
      
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {systemMessage && (
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded mb-6 flex justify-between items-center shadow-sm">
            <span className="text-sm font-medium text-blue-900">{systemMessage}</span>
            <button onClick={() => setSystemMessage('')} className="text-blue-500 font-bold text-xs hover:underline cursor-pointer">Entendido</button>
          </div>
        )}
        
        {currentView === 'home' && (
          isCatalogLoading ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-70">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mb-4"></div>
              <p className="text-slate-800 font-bold">Conectando con el catálogo...</p>
            </div>
          ) : (
            <Catalog products={catalogProducts as any} cart={shoppingCart as any} setShoppingCart={setShoppingCart as any} />
          )
        )}
        {currentView === 'nosotros' && <Nosotros />}
        {currentView === 'contacto' && <Contacto />}
      </main>
      
      <Footer />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} setStatusMessage={setSystemMessage} setShowChangePwd={setIsPasswordModalOpen} />
      <ChangePasswordModal isOpen={isPasswordModalOpen} setStatusMessage={setSystemMessage} onSuccess={() => setIsPasswordModalOpen(false)} />

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-dvh shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black uppercase text-slate-900 flex items-center"><CartIcon size={20} className="mr-2"/> Tu Pedido</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-500 hover:text-slate-900 bg-slate-200 rounded-full cursor-pointer"><X size={18} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {shoppingCart.length === 0 ? (
                <div className="text-center text-slate-400 mt-10"><CartIcon size={48} className="mx-auto mb-4 opacity-20"/> <p>Tu carrito está vacío.</p></div>
              ) : (
                shoppingCart.map(item => (
                  <div key={item.product.sku} className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900">{item.product.name}</p>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <button onClick={() => updateCartQuantity(item.product.sku, -1)} className="w-6 h-6 flex items-center justify-center bg-slate-200 rounded-md text-slate-700 font-bold hover:bg-slate-300 cursor-pointer">-</button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.product.sku, 1)} className="w-6 h-6 flex items-center justify-center bg-slate-200 rounded-md text-slate-700 font-bold hover:bg-slate-300 cursor-pointer">+</button>
                      </div>

                    </div>
                    <div className="flex items-center space-x-3 ml-2">
                      <span className="font-black text-sm">${formatPrice(((item.product.isPromo ? item.product.promoPrice : item.product.unitPrice) ?? 0) * item.quantity)}</span>
                      <button onClick={() => setShoppingCart(shoppingCart.filter(i => i.product.sku !== item.product.sku))} className="text-red-400 hover:text-red-600 cursor-pointer p-1"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {shoppingCart.length > 0 && (
              <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-slate-600">Total Neto:</span>
                  <span className="text-xl font-black text-slate-900">
                    ${formatPrice(cartTotal)}
                  </span>
                </div>
                
                {/* 🚀 BOTONES DE CONFIRMAR POR WA Y VACIAR CARRITO */}
                <div className="space-y-3">
                  <a 
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#25D366] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#128C7E] transition cursor-pointer flex items-center justify-center"
                  >
                    <MessageCircle size={20} className="mr-2" />
                    Confirmar por WhatsApp
                  </a>
                  
                  <button 
                    onClick={() => setShoppingCart([])}
                    className="w-full bg-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-300 transition cursor-pointer flex items-center justify-center"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Vaciar Carrito
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}