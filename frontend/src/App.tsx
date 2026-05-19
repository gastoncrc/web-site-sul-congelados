import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './config/api';
import type { Product, CartItem } from './types';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoginModal, ChangePasswordModal } from './components/Modals';

import { Catalog } from './pages/Catalog';
import { Admin } from './pages/Admin';
import { Nosotros } from './pages/Nosotros';
import { Contacto } from './pages/Contacto';

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

function MainLayout() {
  const { token, user, logout } = useAuth();
  
  const [currentView, setCurrentView] = useState<'home' | 'nosotros' | 'contacto' | 'admin'>('home');
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [shoppingCart, setShoppingCart] = useState<CartItem[]>([]);
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [systemMessage, setSystemMessage] = useState('');

  const fetchCatalogData = async () => {
    try {
      const response = await api.get(`/products?t=${new Date().getTime()}`);
      setCatalogProducts(response.data);
    } catch (error) {
      setCatalogProducts([]); 
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, [token, currentView]);

  // 🚀 INTERCEPTOR ADMIN: Full screen dashboard
  if (user?.role === 'Admin') {
    return (
      <div className="h-screen w-screen bg-[#0f172a] font-sans text-gray-800 overflow-hidden relative">
        
        {/* 🚀 NUEVO BOTÓN DE SALIDA PARA EL ADMIN */}
        <button 
          onClick={logout} 
          className="absolute top-4 right-4 z-50 bg-red-900/50 text-red-200 border border-red-700/50 px-4 py-2 rounded-lg flex items-center hover:bg-red-800 transition font-bold text-sm shadow-lg cursor-pointer"
        >
          Cerrar Sesión Admin
        </button>

        {systemMessage && (
          <div className="absolute top-16 right-4 z-50 bg-blue-50 border-l-4 border-blue-600 p-4 rounded shadow-lg flex justify-between items-center min-w-75">
            <span className="text-sm font-medium text-blue-900">{systemMessage}</span>
            <button onClick={() => setSystemMessage('')} className="ml-4 text-blue-500 font-bold text-xs hover:underline">X</button>
          </div>
        )}
        <Admin setSystemMessage={setSystemMessage} triggerDataRefresh={fetchCatalogData} />
      </div>
    );
  }

  // 🛒 CLIENT VIEW
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800 overflow-x-hidden">
      <Header currentTab={currentView} setCurrentTab={setCurrentView} openLogin={() => setIsLoginModalOpen(true)} />
      
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {systemMessage && (
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded mb-6 flex justify-between items-center shadow-sm">
            <span className="text-sm font-medium text-blue-900">{systemMessage}</span>
            <button onClick={() => setSystemMessage('')} className="text-blue-500 font-bold text-xs hover:underline">Entendido</button>
          </div>
        )}
        
        {currentView === 'home' && <Catalog products={catalogProducts} cart={shoppingCart} setCart={setShoppingCart} openLogin={() => setIsLoginModalOpen(true)} />}
        {currentView === 'nosotros' && <Nosotros />}
        {currentView === 'contacto' && <Contacto />}
      </main>
      
      <Footer />
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        setStatusMessage={setSystemMessage} 
        setShowChangePwd={setIsPasswordModalOpen} 
      />
      
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        setStatusMessage={setSystemMessage} 
        onSuccess={() => setIsPasswordModalOpen(false)} 
      />
    </div>
  );
}