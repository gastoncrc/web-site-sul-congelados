import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User as UserIcon, LogOut, Menu, X, ShoppingCart } from 'lucide-react'; 
import { useAuth } from '../context/AuthContext';
import logoSUL from '../assets/logo_sul.png'; 

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: any) => void; // Se mantiene por compatibilidad si es necesario, aunque usaremos navegación directa
  openLogin: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ openLogin, cartCount = 0, onOpenCart }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-[#003366] text-white shadow-md sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between relative">
        
        {/* Logo SUL */}
        <Link 
          to="/"
          className="absolute -top-2 sm:-top-3 left-4 sm:left-6 z-50 cursor-pointer drop-shadow-lg transition-transform hover:scale-105" 
        >
          <img 
            src={logoSUL} 
            alt="SUL Congelados" 
            className="h-20 sm:h-28 w-auto object-contain" 
          />
        </Link>
        
        <div className="w-20 sm:w-44 md:w-56 h-1 shrink-0" />
        
        {/* 🖥️ NAVEGACIÓN DESKTOP */}
        <nav className="hidden md:flex items-center space-x-8 font-medium text-base">
          <Link to="/" className={`hover:text-blue-200 transition ${isActive('/') ? 'text-blue-300 underline' : ''}`}>Catálogo</Link>
          <Link to="/nosotros" className={`hover:text-blue-200 transition ${isActive('/nosotros') ? 'text-blue-300 underline' : ''}`}>Nosotros</Link>
          <Link to="/contacto" className={`hover:text-blue-200 transition ${isActive('/contacto') ? 'text-blue-300 underline' : ''}`}>Contacto</Link>
        </nav>
        
        <div className="flex items-center ml-auto">
          <button onClick={onOpenCart} className="relative mr-4 p-2 text-white hover:text-blue-200 transition cursor-pointer">
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#003366]">
                {cartCount}
              </span>
            )}
          </button>

          <div className="hidden md:flex items-center">
            {user ? (
              <div className="flex items-center space-x-3 bg-[#002244] px-4 py-2 rounded-full border border-blue-800">
                <UserIcon size={14} className="text-blue-300 shrink-0" />
                <span className="text-xs font-semibold truncate">
                  {user?.name || user?.email.split('@')[0]}
                </span>
                <button onClick={logout} className="text-red-400 hover:text-red-300 ml-2 cursor-pointer"><LogOut size={14} /></button>
              </div>
            ) : (
              <button onClick={openLogin} className="bg-white text-[#003366] font-bold px-5 py-2 rounded-lg hover:bg-blue-50 transition shadow text-sm cursor-pointer">Acceso Clientes</button>
            )}
          </div>
        </div>

        <div className="md:hidden flex items-center ml-2">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2 focus:outline-none cursor-pointer">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* 📱 MENÚ MOBILE */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#002244] border-t border-blue-900 absolute w-full left-0 top-20 shadow-xl z-40">
          <div className="px-4 pt-2 pb-6 space-y-3 flex flex-col">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`text-left block px-3 py-2 rounded-md text-base font-medium ${isActive('/') ? 'bg-blue-900 text-white' : 'text-blue-200 hover:bg-blue-800'}`}>Catálogo</Link>
            <Link to="/nosotros" onClick={() => setIsMobileMenuOpen(false)} className={`text-left block px-3 py-2 rounded-md text-base font-medium ${isActive('/nosotros') ? 'bg-blue-900 text-white' : 'text-blue-200 hover:bg-blue-800'}`}>Nosotros</Link>
            <Link to="/contacto" onClick={() => setIsMobileMenuOpen(false)} className={`text-left block px-3 py-2 rounded-md text-base font-medium ${isActive('/contacto') ? 'bg-blue-900 text-white' : 'text-blue-200 hover:bg-blue-800'}`}>Contacto</Link>
            
            <hr className="border-blue-800 my-2" />
            
            {user ? (
              <div className="flex items-center justify-between bg-[#001a33] px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <UserIcon size={18} className="text-blue-300 shrink-0" />
                  <span className="text-sm font-semibold text-white max-w-20 truncate">
                    {user?.name || user?.email.split('@')[0]}
                  </span>
                </div>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-red-400 hover:text-red-300 flex items-center cursor-pointer"><LogOut size={16} className="mr-1"/> Salir</button>
              </div>
            ) : (
              <button onClick={() => { openLogin(); setIsMobileMenuOpen(false); }} className="w-full bg-white text-[#003366] font-bold px-5 py-3 rounded-lg shadow text-sm mt-2 cursor-pointer">Acceso Clientes</button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};