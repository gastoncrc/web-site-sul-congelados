import React, { useState } from 'react';
import { UserPlus, Save } from 'lucide-react';
import { api } from '../../config/api';

interface ClientFormProps {
  setSystemMessage: (msg: string) => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ setSystemMessage }) => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    convenio: 'CORDOBA',
    is_active: true
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/create', formData);
      setSystemMessage('✅ Cliente creado/actualizado exitosamente.');
      setFormData({ username: '', name: '', convenio: 'CORDOBA', is_active: true });
    } catch (error) {
      setSystemMessage('🚨 Error al guardar el cliente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 mt-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-slate-900 p-3 rounded-xl"><UserPlus className="text-[#deff9a]" size={24} /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase">Alta de Cliente</h2>
          <p className="text-sm text-slate-500 font-medium">La contraseña por defecto será: <span className="font-mono bg-slate-100 px-1 rounded text-slate-700">SULcongelados2026</span></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase mb-2">Código Cliente (Usuario) *</label>
            <input 
              type="text" required
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900" 
              placeholder="Ej: 80000193"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase mb-2">Razón Social / Nombre *</label>
            <input 
              type="text" required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900" 
              placeholder="Ej: 2 CAÑADA"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-black text-slate-700 uppercase mb-2">Lista de Precios (Convenio) *</label>
            <input 
              type="text" required
              value={formData.convenio}
              onChange={e => setFormData({...formData, convenio: e.target.value})}
              className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900" 
              placeholder="Ej: 2x1 Cordoba"
            />
          </div>
        </div>

        <div className="flex items-center pt-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.is_active} 
              onChange={e => setFormData({...formData, is_active: e.target.checked})} 
              className="rounded border-slate-300 w-5 h-5 text-slate-900 focus:ring-slate-900 cursor-pointer" 
            />
            <span className="text-sm font-bold text-slate-700 uppercase">Cuenta Activa</span>
          </label>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-slate-800 transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <Save size={18} />
            <span>{isLoading ? 'Guardando...' : 'Crear Cliente'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};