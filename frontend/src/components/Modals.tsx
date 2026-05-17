import { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { api } from '../config/api';
import { useAuth } from '../context/AuthContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  setStatusMessage: (msg: string) => void;
  setShowChangePwd: (show: boolean) => void;
}

export const LoginModal: React.FC<ModalProps> = ({ isOpen, onClose, setStatusMessage, setShowChangePwd }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // ✅ Ruta simplificada corregida
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      
      login(user, token);
      onClose();
      setEmail('');
      setPassword('');

      if (user.requirePasswordChange) {
        setShowChangePwd(true);
      } else {
        setStatusMessage(`👋 ¡Bienvenido, ${user.name || user.email}!`);
      }
    } catch (err) {
      alert('Credenciales inválidas para el portal de SUL Congelados o error de red.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-gray-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1"><X size={20} /></button>
        <div className="mb-5">
          <h3 className="text-lg font-black text-[#003366] uppercase tracking-wider">Portal Clientes</h3>
          <p className="text-xs text-gray-400 mt-0.5">Ingresá tus credenciales autorizadas.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email Corporativo</label>
            <input type="email" placeholder="cl_80000XXX@sul.com o admin@sul.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Contraseña</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm outline-none" required />
          </div>
          <button type="submit" className="w-full bg-[#003366] text-white py-3 rounded-lg font-bold text-xs sm:text-sm hover:bg-blue-800 transition shadow-md">
            Ingresar de forma segura
          </button>
        </form>
      </div>
    </div>
  );
};

export const ChangePasswordModal: React.FC<{ isOpen: boolean; setStatusMessage: (msg: string) => void; onSuccess: () => void }> = ({ isOpen, setStatusMessage, onSuccess }) => {
  const { updatePasswordStatus } = useAuth();
  const [newPassword, setNewPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return alert('Debe tener al menos 6 caracteres.');

    try {
      // ✅ Ruta simplificada corregida
      await api.post('/auth/change-password', { newPassword });
      updatePasswordStatus();
      onSuccess();
      setNewPassword('');
      setStatusMessage('🔒 Contraseña comercial actualizada. Catálogo activado.');
    } catch (err) {
      alert('Error actualizando la clave.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center border-2 border-blue-600">
        <div className="bg-blue-50 p-3 rounded-full text-[#003366] w-fit mx-auto mb-3"><Lock size={28} /></div>
        <h3 className="text-lg font-black text-[#003366] uppercase mb-2">Actualización de Seguridad</h3>
        <p className="text-xs text-gray-500 mb-4">Ingresaste con la credencial genérica de SUL. Debes configurar una contraseña privada.</p>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nueva Contraseña Comercial</label>
            <input type="password" placeholder="Escribí tu nueva clave" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 bg-gray-50 border border-blue-200 rounded-lg text-xs sm:text-sm font-mono outline-none" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-xs sm:text-sm hover:bg-blue-700 transition shadow-md">
            Blindar Cuenta y Activar Catálogo
          </button>
        </form>
      </div>
    </div>
  );
};