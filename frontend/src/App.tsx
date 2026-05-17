import { useState, useEffect } from 'react'; // ✅ Limpiado el import muerto de React
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
  const { token } = useAuth();
  const [currentTab, setCurrentTab] = useState<'home' | 'nosotros' | 'contacto' | 'admin'>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [showLogin, setShowLogin] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      setProducts([]); 
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token, currentTab]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800 overflow-x-hidden">
      
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} openLogin={() => setShowLogin(true)} />

      {/* ✅ Optimizado con tu sugerencia de Tailwind nativo (grow) */}
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {statusMessage && (
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded mb-6 flex justify-between items-center shadow-sm">
            <span className="text-sm font-medium text-blue-900">{statusMessage}</span>
            <button onClick={() => setStatusMessage('')} className="text-blue-500 font-bold text-xs hover:underline">Entendido</button>
          </div>
        )}

        {currentTab === 'home' && <Catalog products={products} cart={cart} setCart={setCart} openLogin={() => setShowLogin(true)} />}
        {currentTab === 'admin' && <Admin setStatusMessage={setStatusMessage} triggerRefresh={fetchProducts} />}
        {currentTab === 'nosotros' && <Nosotros />}
        {currentTab === 'contacto' && <Contacto />}
      </main>

      <Footer />

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} setStatusMessage={setStatusMessage} setShowChangePwd={setShowChangePwd} />
      <ChangePasswordModal isOpen={showChangePwd} setStatusMessage={setStatusMessage} onSuccess={() => setShowChangePwd(false)} />
    </div>
  );
}