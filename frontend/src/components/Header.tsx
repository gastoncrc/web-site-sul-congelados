import React, { useState } from 'react';
import { User as UserIcon, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoSUL from '../assets/logo_sul.png'; 

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: any) => void;
  openLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, openLogin }) => {
  const { user, logout } = useAuth();
  
  // UI State para el Menú Móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigation = (tab: string) => {
    setCurrentTab(tab);
    setIsMobileMenuOpen(false); // Cierra el menú al hacer click en el celu
  };

  return (
    <header className="bg-[#003366] text-white shadow-md sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between relative">
        
        {/* Logo SUL flotante */}
        <div 
          className="absolute -top-2 sm:-top-3 left-4 sm:left-6 z-50 cursor-pointer drop-shadow-lg transition-transform hover:scale-105" 
          onClick={() => handleNavigation('home')}
        >
          <img 
            src={logoSUL} 
            alt="SUL Congelados" 
            className="h-20 sm:h-28 w-auto object-contain" 
          />
        </div>
        
        {/* Espaciador invisible (corregido con shrink-0) */}
        <div className="w-20 sm:w-44 md:w-56 h-1 shrink-0" />
        
        {/* 🖥️ NAVEGACIÓN DESKTOP (Se oculta en mobile) */}
        <nav className="hidden md:flex items-center space-x-8 font-medium text-base">
          <button onClick={() => setCurrentTab('home')} className={`hover:text-blue-200 transition ${currentTab === 'home' ? 'text-blue-300 underline' : ''}`}>Catálogo</button>
          <button onClick={() => setCurrentTab('nosotros')} className={`hover:text-blue-200 transition ${currentTab === 'nosotros' ? 'text-blue-300 underline' : ''}`}>Nosotros</button>
          <button onClick={() => setCurrentTab('contacto')} className={`hover:text-blue-200 transition ${currentTab === 'contacto' ? 'text-blue-300 underline' : ''}`}>Contacto</button>
        </nav>
        
        {/* 🖥️ BOTONES DE SESIÓN DESKTOP (Se ocultan en mobile) */}
        <div className="hidden md:flex items-center ml-4">
          {user ? (
            <div className="flex items-center space-x-3 bg-[#002244] px-4 py-2 rounded-full border border-blue-800">
              <UserIcon size={14} className="text-blue-300 shrink-0" />
              <span className="text-xs font-semibold truncate">
                {user?.name || user?.email.split('@')[0]}
              </span>
              <button onClick={logout} className="text-red-400 hover:text-red-300 ml-2"><LogOut size={14} /></button>
            </div>
          ) : (
            <button onClick={openLogin} className="bg-white text-[#003366] font-bold px-5 py-2 rounded-lg hover:bg-blue-50 transition shadow text-sm">Acceso Clientes</button>
          )}
        </div>

        {/* 📱 BOTÓN HAMBURGUESA PARA MOBILE */}
        <div className="md:hidden flex items-center justify-end flex-1">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="text-white p-2 focus:outline-none"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* 📱 MENÚ DESPLEGABLE MOBILE */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#002244] border-t border-blue-900 absolute w-full left-0 top-20 shadow-xl z-40">
          <div className="px-4 pt-2 pb-6 space-y-3 flex flex-col">
            <button onClick={() => handleNavigation('home')} className={`text-left block px-3 py-2 rounded-md text-base font-medium ${currentTab === 'home' ? 'bg-blue-900 text-white' : 'text-blue-200 hover:bg-blue-800'}`}>Catálogo</button>
            <button onClick={() => handleNavigation('nosotros')} className={`text-left block px-3 py-2 rounded-md text-base font-medium ${currentTab === 'nosotros' ? 'bg-blue-900 text-white' : 'text-blue-200 hover:bg-blue-800'}`}>Nosotros</button>
            <button onClick={() => handleNavigation('contacto')} className={`text-left block px-3 py-2 rounded-md text-base font-medium ${currentTab === 'contacto' ? 'bg-blue-900 text-white' : 'text-blue-200 hover:bg-blue-800'}`}>Contacto</button>
            
            <hr className="border-blue-800 my-2" />
            
            {user ? (
              <div className="flex items-center justify-between bg-[#001a33] px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <UserIcon size={18} className="text-blue-300 shrink-0" />
                  <span className="text-sm font-semibold text-white max-w-20 truncate">
                    {user?.name || user?.email.split('@')[0]}
                  </span>
                </div>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-red-400 hover:text-red-300 flex items-center"><LogOut size={16} className="mr-1"/> Salir</button>
              </div>
            ) : (
              <button onClick={() => { openLogin(); setIsMobileMenuOpen(false); }} className="w-full bg-white text-[#003366] font-bold px-5 py-3 rounded-lg shadow text-sm mt-2">Acceso Clientes</button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};