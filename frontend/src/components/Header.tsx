import { User as UserIcon, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoSUL from '../assets/logo_sul.png'; // ✅ Importamos de vuelta tu logo nativo

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: any) => void;
  openLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, openLogin }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-[#003366] text-white shadow-md sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between relative">
        
        {/* ✅ Logo SUL recuperado y flotando de forma limpia con Tailwind nativo */}
        <div 
          className="absolute -top-2 sm:-top-3 left-4 sm:left-6 z-50 cursor-pointer drop-shadow-lg transition-transform hover:scale-105" 
          onClick={() => setCurrentTab('home')}
        >
          <img 
            src={logoSUL} 
            alt="SUL Congelados" 
            className="h-20 sm:h-28 w-auto object-contain" 
          />
        </div>
        
        <div className="w-20 sm:w-44 md:w-56 h-1 flex-shrink-0" />
        
        <nav className="flex items-center space-x-3 sm:space-x-6 md:space-x-8 font-medium text-xs sm:text-sm md:text-base">
          <button onClick={() => setCurrentTab('home')} className={`hover:text-blue-200 transition ${currentTab === 'home' ? 'text-blue-300 underline' : ''}`}>Catálogo</button>
          <button onClick={() => setCurrentTab('nosotros')} className={`hidden sm:inline-block hover:text-blue-200 transition ${currentTab === 'nosotros' ? 'text-blue-300 underline' : ''}`}>Nosotros</button>
          <button onClick={() => setCurrentTab('contacto')} className={`hover:text-blue-200 transition ${currentTab === 'contacto' ? 'text-blue-300 underline' : ''}`}>Contacto</button>
          {user?.role === 'Admin' && (
            <button onClick={() => setCurrentTab('admin')} className="flex items-center space-x-1 text-yellow-400 font-bold hover:text-yellow-300">
              <Shield size={14} /> <span>Panel Admin</span>
            </button>
          )}
        </nav>
        
        <div className="flex items-center ml-2 sm:ml-4">
          {user ? (
            <div className="flex items-center space-x-1 sm:space-x-3 bg-[#002244] px-2 py-1 sm:px-4 sm:py-2 rounded-full border border-blue-800 max-w-[140px] sm:max-w-none">
              <UserIcon size={14} className="text-blue-300 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-semibold truncate max-w-[80px] sm:max-w-none">
                {user?.name || user?.email.split('@')[0]}
              </span>
              <button onClick={logout} className="text-red-400 hover:text-red-300 ml-1 sm:ml-2"><LogOut size={14} /></button>
            </div>
          ) : (
            <button onClick={openLogin} className="bg-white text-[#003366] font-bold px-3 py-1.5 sm:px-5 sm:py-2 rounded-lg hover:bg-blue-50 transition shadow text-xs sm:text-sm">Acceso Clientes</button>
          )}
        </div>
      </div>
    </header>
  );
};