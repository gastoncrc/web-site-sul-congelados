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
    <header className="bg-brand-primary text-white shadow-md sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between relative">

        {/* Logo SUL */}
        <Link
          to="/"
          className="absolute -top-2 sm:-top-3 left-4 sm:left-6 z-50 cursor-pointer drop-shadow-lg transition-transform hover:scale-105"
        >
          <img
            src={logoSUL}
            alt="SUL Congelados"
            className="h-16 sm:h-24 w-auto object-contain"
          />
        </Link>

        <div className="w-24 sm:w-36 md:w-48 h-1 shrink-0" />

        {/* 🖥️ NAVEGACIÓN DESKTOP */}
        <nav className="hidden md:flex items-center space-x-8 font-heading font-medium text-base">
          <Link to="/" className={`hover:text-brand-gold transition ${isActive('/') ? 'text-brand-gold' : ''}`}>Catálogo</Link>
          <Link to="/nosotros" className={`hover:text-brand-gold transition ${isActive('/nosotros') ? 'text-brand-gold' : ''}`}>Nosotros</Link>
          <Link to="/contacto" className={`hover:text-brand-gold transition ${isActive('/contacto') ? 'text-brand-gold' : ''}`}>Contacto</Link>
        </nav>

        <div className="flex items-center ml-auto">
          <button onClick={onOpenCart} className="relative mr-4 p-2 text-white hover:text-brand-gold transition cursor-pointer">
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-danger text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-brand-primary">
                {cartCount}
              </span>
            )}
          </button>

          <div className="hidden md:flex items-center">
            {user ? (
              <div className="flex items-center space-x-3 bg-neutral-dark px-4 py-2 rounded-full border border-white/10">
                <UserIcon size={14} className="text-brand-gold shrink-0" />
                <span className="text-xs font-semibold truncate">
                  {user?.name || user?.email.split('@')[0]}
                </span>
                <button onClick={logout} className="text-danger hover:text-red-400 ml-2 cursor-pointer"><LogOut size={14} /></button>
              </div>
            ) : (
              <button onClick={openLogin} className="bg-white text-brand-primary font-bold px-5 py-2 rounded-lg hover:bg-brand-gold hover:text-brand-gold-on transition shadow text-sm cursor-pointer">Acceso Clientes</button>
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
        <div className="md:hidden bg-neutral-dark border-t border-white/10 absolute w-full left-0 top-20 shadow-xl z-40">
          <div className="px-4 pt-2 pb-6 space-y-3 flex flex-col font-heading">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`text-left block px-3 py-2 rounded-md text-base font-medium ${isActive('/') ? 'bg-brand-primary text-white' : 'text-white/80 hover:bg-white/10'}`}>Catálogo</Link>
            <Link to="/nosotros" onClick={() => setIsMobileMenuOpen(false)} className={`text-left block px-3 py-2 rounded-md text-base font-medium ${isActive('/nosotros') ? 'bg-brand-primary text-white' : 'text-white/80 hover:bg-white/10'}`}>Nosotros</Link>
            <Link to="/contacto" onClick={() => setIsMobileMenuOpen(false)} className={`text-left block px-3 py-2 rounded-md text-base font-medium ${isActive('/contacto') ? 'bg-brand-primary text-white' : 'text-white/80 hover:bg-white/10'}`}>Contacto</Link>

            <hr className="border-white/10 my-2" />

            {user ? (
              <div className="flex items-center justify-between bg-black/20 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <UserIcon size={18} className="text-brand-gold shrink-0" />
                  <span className="text-sm font-semibold text-white max-w-20 truncate">
                    {user?.name || user?.email.split('@')[0]}
                  </span>
                </div>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-danger hover:text-red-400 flex items-center cursor-pointer"><LogOut size={16} className="mr-1"/> Salir</button>
              </div>
            ) : (
              <button onClick={() => { openLogin(); setIsMobileMenuOpen(false); }} className="w-full bg-white text-brand-primary font-bold px-5 py-3 rounded-lg shadow text-sm mt-2 cursor-pointer">Acceso Clientes</button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};