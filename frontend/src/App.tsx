import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './config/api';
import type { Product } from './types'; 

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoginModal, ChangePasswordModal } from './components/Modals';
import { CartSidebar } from './components/CartSidebar'; // 🚀 IMPORTAMOS EL CARRITO

import { Catalog } from './pages/Catalog';
import { Admin } from './pages/Admin';
import { Nosotros } from './pages/Nosotros';
import { Contacto } from './pages/Contacto';

interface AppProduct extends Product { isPromo?: boolean; promoPrice?: number; unitPrice: number; inSlider?: boolean; }
interface AppCartItem { product: AppProduct; quantity: number; }

export default function App() {
  return <AuthProvider><MainLayout /></AuthProvider>;
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
    } finally { setIsCatalogLoading(false); }
  };

  useEffect(() => { if (currentView === 'home') fetchCatalogData(); }, [token, currentView]);
  useEffect(() => { if (!token) setIsPasswordModalOpen(false); }, [token]);

  if (user?.role === 'Admin') {
    return (
      <div className="fixed inset-0 h-dvh w-screen bg-[#0f172a] font-sans text-gray-800 overflow-hidden flex flex-col">
        {systemMessage && (
          <div className="absolute top-4 right-4 z-50 bg-blue-50 border-l-4 border-blue-600 p-4 rounded shadow-lg flex justify-between items-center min-w-75"><span className="text-sm font-medium text-blue-900">{systemMessage}</span><button onClick={() => setSystemMessage('')} className="ml-4 text-blue-500 font-bold text-xs hover:underline cursor-pointer">X</button></div>
        )}
        <Admin setSystemMessage={setSystemMessage} triggerDataRefresh={fetchCatalogData} />
      </div>
    );
  }

  const updateCartQuantity = (sku: string, delta: number) => {
    setShoppingCart(prev => prev.map(item => item.product.sku === sku ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(i => i.quantity > 0));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800 overflow-x-hidden relative">
      <Header currentTab={currentView} setCurrentTab={setCurrentView} openLogin={() => setIsLoginModalOpen(true)} cartCount={shoppingCart.reduce((acc, item) => acc + item.quantity, 0)} onOpenCart={() => setIsCartOpen(true)} />
      
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {systemMessage && (
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded mb-6 flex justify-between items-center shadow-sm"><span className="text-sm font-medium text-blue-900">{systemMessage}</span><button onClick={() => setSystemMessage('')} className="text-blue-500 font-bold text-xs hover:underline cursor-pointer">Entendido</button></div>
        )}
        {currentView === 'home' && (isCatalogLoading ? <div className="text-center py-24"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto mb-4"></div><p className="text-slate-800 font-bold">Conectando...</p></div> : <Catalog products={catalogProducts as any} cart={shoppingCart as any} setShoppingCart={setShoppingCart as any} />)}
        {currentView === 'nosotros' && <Nosotros />}
        {currentView === 'contacto' && <Contacto />}
      </main>
      
      <Footer />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} setStatusMessage={setSystemMessage} setShowChangePwd={setIsPasswordModalOpen} />
      <ChangePasswordModal isOpen={isPasswordModalOpen} setStatusMessage={setSystemMessage} onSuccess={() => setIsPasswordModalOpen(false)} />

      {/* 🚀 EL COMPONENTE DEL CARRITO EN ACCIÓN */}
      <CartSidebar isOpen={isCartOpen} closeCart={() => setIsCartOpen(false)} cart={shoppingCart as any} setShoppingCart={setShoppingCart as any} updateQuantity={updateCartQuantity} user={user} />
    </div>
  );
}