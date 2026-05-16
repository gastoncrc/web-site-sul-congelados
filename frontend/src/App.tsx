import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  ShoppingBag, User as UserIcon, LogOut, Shield, 
  Upload, FileText, Mail, MapPin, ShoppingCart, Trash2, X
} from 'lucide-react';
import axios from 'axios';
import type { Product, User, CartItem } from './types';
import logoSUL from './assets/logo_sul.png';

const API_URL = 'https://web-site-sul-congelados-backend.onrender.com/api';

// ==========================================
// CONTEXTO DE AUTENTICACIÓN (Persistencia)
// ==========================================
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, role: User['role'], token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('sul_user');
    const savedToken = localStorage.getItem('sul_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  const login = (email: string, role: User['role'], inputToken: string) => {
    const newUser: User = { email, role };
    setUser(newUser);
    setToken(inputToken);
    localStorage.setItem('sul_user', JSON.stringify(newUser));
    localStorage.setItem('sul_token', inputToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sul_user');
    localStorage.removeItem('sul_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

function MainLayout() {
  const { user, token, logout, login } = useAuth();
  const [currentTab, setCurrentTab] = useState<'home' | 'nosotros' | 'contacto' | 'admin'>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Cargar catálogo pidiendo datos al servidor seguro
  const fetchProducts = async () => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API_URL}/products`, config);
      setProducts(res.data);
    } catch (err) {
      console.log("Error cargando productos o modo público.");
      setProducts([]); 
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token, currentTab]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: loginEmail,
        password: loginPassword
      });
      const { token: jwtToken, user: userData } = res.data;
      login(userData.email, userData.role, jwtToken);
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
      setStatusMessage('👋 ¡Sesión iniciada correctamente!');
    } catch (err) {
      alert('Credenciales incorrectas para el portal SUL');
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !token) return;

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await axios.post(`${API_URL}/products/upload-prices`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setStatusMessage(res.data.message);
      setCsvFile(null);
      fetchProducts(); // Refresca los precios en pantalla al instante
    } catch (err) {
      setStatusMessage('❌ Error al subir o procesar el archivo CSV.');
    }
  };

  const addToCart = (product: Product, qty: number) => {
    if (qty <= 0) return;
    setCart(prev => {
      const exists = prev.find(item => item.product.sku === product.sku);
      if (exists) {
        return prev.map(item => item.product.sku === product.sku ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const calculateTotal = () => cart.reduce((acc, item) => acc + (item.product.unitPrice * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      <header className="bg-[#003366] text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative">
          
          {/* LOGO MÁS GRANDE QUE SOBRESALE POR ARRIBA Y POR ABAJO */}
          <div 
            className="absolute top-[-12px] left-6 z-50 cursor-pointer drop-shadow-lg transition-transform hover:scale-105" 
            onClick={() => setCurrentTab('home')}
          >
            <img 
              src={logoSUL} 
              alt="SUL Congelados" 
              className="h-28 w-auto object-contain" 
            />
          </div>

          {/* ESPACIADOR INVISIBLE MÁS ANCHO PARA EL LOGO GRANDE */}
          <div className="w-56 h-1 flex-shrink-0" />

          {/* MENÚ DE NAVEGACIÓN */}
          <nav className="flex items-center space-x-8 font-medium">
            <button onClick={() => setCurrentTab('home')} className={`hover:text-blue-200 transition ${currentTab === 'home' ? 'text-blue-300 underline' : ''}`}>Catálogo</button>
            <button onClick={() => setCurrentTab('nosotros')} className={`hover:text-blue-200 transition ${currentTab === 'nosotros' ? 'text-blue-300 underline' : ''}`}>Nosotros</button>
            <button onClick={() => setCurrentTab('contacto')} className={`hover:text-blue-200 transition ${currentTab === 'contacto' ? 'text-blue-300 underline' : ''}`}>Contacto</button>
            {user?.role === 'Admin' && (
              <button onClick={() => setCurrentTab('admin')} className="flex items-center space-x-1 text-yellow-400 font-bold hover:text-yellow-300">
                <Shield size={16} /> <span>Panel Admin</span>
              </button>
            )}
          </nav>

          {/* SECCIÓN DE USUARIO */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3 bg-[#002244] px-4 py-2 rounded-full border border-blue-800">
                <UserIcon size={16} className="text-blue-300" />
                <span className="text-xs font-semibold">{user.email} ({user.role})</span>
                <button onClick={logout} className="text-red-400 hover:text-red-300 ml-2"><LogOut size={16} /></button>
              </div>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="bg-white text-[#003366] font-bold px-5 py-2 rounded-lg hover:bg-blue-50 transition shadow">
                Acceso Clientes
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CONTENIDO DINÁMICO */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-10">
        {statusMessage && (
          <div className="bg-blue-50 border-l-4 border-[#003366] p-4 rounded mb-6 flex justify-between items-center shadow-sm">
            <span className="text-sm font-medium text-blue-900">{statusMessage}</span>
            <button onClick={() => setStatusMessage('')} className="text-blue-500 font-bold text-xs">Cerrar</button>
          </div>
        )}

        {currentTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-black text-[#003366] uppercase tracking-wide">Productos Disponibles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.length > 0 ? (
                  products.map(p => (
                    <div key={p.sku} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">{p.category}</span>
                        <h3 className="text-lg font-bold text-gray-900 mt-2">{p.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                        <p className="text-xs text-gray-400 mt-2 font-mono">SKU: {p.sku} | Stock: {p.stock} bultos</p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-400 block font-medium">Precio B2B</span>
                          <span className="text-xl font-black text-[#003366]">${p.unitPrice.toLocaleString('es-AR')}</span>
                        </div>
                        <button onClick={() => addToCart(p, 1)} className="bg-[#003366] text-white p-2 rounded-lg hover:bg-blue-800 transition">
                          <ShoppingCart size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white border p-6 rounded-xl text-center col-span-2">
                    <p className="text-gray-500 text-sm font-medium">Iniciá sesión con tu cuenta de cliente para validar tu categoría comercial y ver los precios de lista.</p>
                    <button onClick={() => setShowLoginModal(true)} className="mt-4 bg-[#003366] text-white text-xs font-bold px-4 py-2 rounded-lg">Identificarse ahora</button>
                  </div>
                )}
              </div>
            </div>

            {/* CARRITO */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-fit sticky top-24">
              <h3 className="text-lg font-black text-[#003366] uppercase tracking-wider mb-4 flex items-center space-x-2">
                <ShoppingBag size={20} /> <span>Tu Pedido</span>
              </h3>
              {cart.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No hay productos seleccionados.</p>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.product.sku} className="flex justify-between items-center text-sm pb-3 border-b border-gray-100">
                      <div>
                        <p className="font-bold text-gray-900">{item.product.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity} x ${item.product.unitPrice.toLocaleString('es-AR')}</p>
                      </div>
                      <button onClick={() => setCart(prev => prev.filter(i => i.product.sku !== item.product.sku))} className="text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <div className="pt-4 flex justify-between items-center font-black text-lg text-gray-900">
                    <span>Total Estimado:</span>
                    <span className="text-[#003366]">${calculateTotal().toLocaleString('es-AR')}</span>
                  </div>
                  <button onClick={() => alert('Pedido enviado con éxito. Impactará en el sistema logístico de SUL.')} className="w-full bg-[#003366] text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition mt-4">
                    Confirmar Orden B2B
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADMIN */}
        {currentTab === 'admin' && user?.role === 'Admin' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm max-w-2xl mx-auto">
            <h2 className="text-xl font-black text-[#003366] mb-6 flex items-center space-x-2">
              <Upload size={22} /> <span>Actualización Masiva de Listas de Precios</span>
            </h2>
            <form onSubmit={handleCsvUpload} className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} className="hidden" id="csv-file-input" />
                <label htmlFor="csv-file-input" className="cursor-pointer space-y-2 block">
                  <FileText size={40} className="mx-auto text-gray-400" />
                  <p className="text-sm font-semibold text-gray-700">{csvFile ? csvFile.name : 'Seleccionar archivo .csv'}</p>
                  <p className="text-xs text-gray-400">Columnas requeridas: SKU, Minorista, Mayorista, Distribuidor</p>
                </label>
              </div>
              <button type="submit" disabled={!csvFile} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50">
                Procesar Archivo e Inyectar Precios
              </button>
            </form>
          </div>
        )}

        {currentTab === 'nosotros' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl font-black text-[#003366]">SUL ALIMENTOS & CONGELADOS</h2>
            <p className="text-gray-600 leading-relaxed">Somos una empresa líder especializada en el procesamiento mayorista y distribución de soluciones gastronómicas congeladas. Con foco en la eficiencia operativa, garantizamos el abastecimiento continuo a distribuidores, cadenas de fast-food y comedores industriales de todo el país.</p>
          </div>
        )}

        {currentTab === 'contacto' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-[#003366]">CONTACTO COMERCIAL</h2>
              <div className="flex items-center space-x-3 text-sm text-gray-600"><MapPin size={18} /> <span>Córdoba, Argentina</span></div>
              <div className="flex items-center space-x-3 text-sm text-gray-600"><Mail size={18} /> <span>contacto@sul.com</span></div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); alert('Mensaje comercial recibido.'); }} className="space-y-4">
              <input type="text" placeholder="Razón Social / Empresa" className="w-full p-3 border rounded-lg text-sm" required />
              <input type="email" placeholder="Correo electrónico" className="w-full p-3 border rounded-lg text-sm" required />
              <textarea placeholder="Consulta sobre volúmenes o logística" rows={4} className="w-full p-3 border rounded-lg text-sm" required></textarea>
              <button type="submit" className="w-full bg-[#003366] text-white py-3 rounded-lg font-bold text-sm hover:bg-blue-800 transition">Enviar Solicitud de Alta</button>
            </form>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-8 border-t border-gray-800 text-xs text-center">
        <p className="font-bold text-gray-200 mb-2">SUL Alimentos & Congelados © 2026</p>
        <p>Infraestructura B2B de Alta Disponibilidad conectada mediante API Criptográfica.</p>
      </footer>

      {/* MODAL LOGIN MULTIPANTALLA / RESPONSIVO */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-gray-100">
            
            {/* Botón X de Cierre absoluto para liberar espacio */}
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-black text-[#003366] uppercase tracking-wider">Portal Clientes B2B</h3>
              <p className="text-xs text-gray-400 mt-1">Ingresá tus credenciales autorizadas de SUL.</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  placeholder="ejemplo@sul.com" 
                  value={loginEmail} 
                  onChange={e => setLoginEmail(e.target.value)} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={loginPassword} 
                  onChange={e => setLoginPassword(e.target.value)} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all" 
                  required 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#003366] text-white py-3 rounded-lg font-bold text-sm hover:bg-blue-800 shadow-md hover:shadow-lg transition-all mt-2"
              >
                Ingresar de forma segura
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}