import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { Product } from './types';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoginModal, ChangePasswordModal } from './components/Modals';
import { CartSidebar } from './components/CartSidebar';
import { ToastStack } from './components/ToastStack';
import { useToastQueue } from './hooks/useToastQueue';

import { Catalog } from './pages/Catalog';
import { Nosotros } from './pages/Nosotros';
import { Contacto } from './pages/Contacto';
import { PedidoRapido } from './pages/PedidoRapido';
import { MisPedidos } from './pages/MisPedidos';
import { ResetPassword } from './pages/ResetPassword';

// El panel Admin (gráficos de Recharts, tablas CRUD completas) solo lo usa el
// personal de SUL — separado en su propio chunk para que los visitantes del
// catálogo no lo descarguen en el bundle principal.
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));

interface AppProduct extends Product { isPromo?: boolean; promoPrice?: number; unitPrice: number; inSlider?: boolean; }
interface AppCartItem { product: AppProduct; quantity: number; }

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </Router>
  );
}

function MainLayout() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [shoppingCart, setShoppingCart] = useState<AppCartItem[]>((() => {
    try {
      const savedCart = localStorage.getItem('sul_shopping_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      return [];
    }
  }));

  useEffect(() => {
    localStorage.setItem('sul_shopping_cart', JSON.stringify(shoppingCart));
  }, [shoppingCart]);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toasts, pushToast, dismissToast } = useToastQueue();
  // Mismo nombre que antes en todos los props/children — ahora empuja a la pila de
  // toasts (abajo a la derecha, se cierran solos) en vez de un cartel fijo arriba.
  const setSystemMessage = pushToast;

  useEffect(() => {
    if (sessionStorage.getItem('sul_session_expired')) {
      sessionStorage.removeItem('sul_session_expired');
      setSystemMessage('🔒 Tu sesión venció. Volvé a iniciar sesión para continuar.');
    }
  }, []);

  useEffect(() => { if (!token) setIsPasswordModalOpen(false); }, [token]);

  // Si el usuario es Admin, lo mandamos a la ruta /admin (o manejamos su vista especial)
  useEffect(() => {
    if (user?.role === 'Admin' && location.pathname !== '/admin') {
      navigate('/admin');
    }
  }, [user, navigate, location.pathname]);

  if (user?.role === 'Admin') {
    return (
      <div className="fixed inset-0 h-dvh w-screen bg-brand-primary font-sans text-gray-800 overflow-hidden flex flex-col">
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
        <Suspense fallback={<div className="flex items-center justify-center h-full text-white font-bold">Cargando panel...</div>}>
          <Routes>
            <Route path="/admin" element={<Admin setSystemMessage={setSystemMessage} />} />
            <Route path="*" element={<Admin setSystemMessage={setSystemMessage} />} />
          </Routes>
        </Suspense>
        <ChangePasswordModal isOpen={isPasswordModalOpen} setStatusMessage={setSystemMessage} onSuccess={() => setIsPasswordModalOpen(false)} />
      </div>
    );
  }

  const updateCartQuantity = (sku: string, delta: number) => {
    setShoppingCart(prev => prev.map(item => item.product.sku === sku ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(i => i.quantity > 0));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800 overflow-x-hidden relative">
      <Header 
        currentTab={location.pathname === '/' ? 'home' : location.pathname.substring(1)} 
        setCurrentTab={(tab) => navigate(tab === 'home' ? '/' : `/${tab}`)} 
        openLogin={() => setIsLoginModalOpen(true)} 
        cartCount={shoppingCart.reduce((acc, item) => acc + item.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)} 
      />
      
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Routes>
          <Route path="/" element={<Catalog cart={shoppingCart as any} setShoppingCart={setShoppingCart as any} openLogin={() => setIsLoginModalOpen(true)} />} />
          <Route path="/pedido-rapido" element={<PedidoRapido cart={shoppingCart as any} setShoppingCart={setShoppingCart as any} />} />
          <Route path="/mis-pedidos" element={<MisPedidos setShoppingCart={setShoppingCart as any} openLogin={() => setIsLoginModalOpen(true)} />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Si alguien intenta entrar a /admin no siendo admin, lo mandamos a home */}
          <Route path="/admin" element={<div className="text-center py-24">Acceso denegado</div>} />
        </Routes>
      </main>
      
      <Footer />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} setStatusMessage={setSystemMessage} setShowChangePwd={setIsPasswordModalOpen} />
      <ChangePasswordModal isOpen={isPasswordModalOpen} setStatusMessage={setSystemMessage} onSuccess={() => setIsPasswordModalOpen(false)} />

      <CartSidebar isOpen={isCartOpen} closeCart={() => setIsCartOpen(false)} cart={shoppingCart as any} setShoppingCart={setShoppingCart as any} updateQuantity={updateCartQuantity} user={user} />
    </div>
  );
}