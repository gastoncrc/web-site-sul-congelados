import React, { useState } from 'react';
import { UserPlus, Save } from 'lucide-react';
import { api } from '../../config/api';

interface ClientFormProps {
  setSystemMessage: (msg: string) => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ setSystemMessage }) => {
  const [formData, setFormData] = useState({
    tradeName: '', businessName: '', taxId: '', address: '', city: '', 
    province: '', phone: '', email: '', seller: '', agreement: 'CORDOBA', group: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 🚀 Apuntamos a la ruta de tu registerClientAdmin
      await api.post('/auth/register-client-admin', formData);
      setSystemMessage('✅ Cliente creado exitosamente. La contraseña temporal es SUL2026!');
      setFormData({ tradeName: '', businessName: '', taxId: '', address: '', city: '', province: '', phone: '', email: '', seller: '', agreement: 'CORDOBA', group: '' });
    } catch (error: any) {
      setSystemMessage(`🚨 Error: ${error.response?.data?.error || 'No se pudo guardar el cliente'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 mt-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-slate-900 p-3 rounded-xl"><UserPlus className="text-[#deff9a]" size={24} /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase">Alta Manual de Cliente</h2>
          <p className="text-sm text-slate-500 font-medium">Completá todos los datos para dar de alta un cliente fuera de Excel.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-xs font-black text-slate-700 uppercase mb-2">Nombre Comercial / Local *</label>
            <input type="text" required value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" />
          </div>
          <div><label className="block text-xs font-black text-slate-700 uppercase mb-2">Razón Social</label>
            <input type="text" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" />
          </div>
          <div><label className="block text-xs font-black text-slate-700 uppercase mb-2">CUIT</label>
            <input type="text" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" />
          </div>
          <div><label className="block text-xs font-black text-slate-700 uppercase mb-2">Email (Usado para el login) *</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" />
          </div>
          <div><label className="block text-xs font-black text-slate-700 uppercase mb-2">Dirección de Entrega</label>
            <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" />
          </div>
          <div className="flex gap-4">
            <div className="w-1/2"><label className="block text-xs font-black text-slate-700 uppercase mb-2">Localidad</label>
              <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" />
            </div>
            <div className="w-1/2"><label className="block text-xs font-black text-slate-700 uppercase mb-2">Provincia</label>
              <input type="text" value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" />
            </div>
          </div>
          <div><label className="block text-xs font-black text-slate-700 uppercase mb-2">Teléfono / WhatsApp</label>
            <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" />
          </div>
          <div><label className="block text-xs font-black text-slate-700 uppercase mb-2">Vendedor Asignado</label>
            <input type="text" value={formData.seller} onChange={e => setFormData({...formData, seller: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" />
          </div>
          <div><label className="block text-xs font-black text-slate-700 uppercase mb-2">Convenio (Lista de Precios) *</label>
            <input type="text" required value={formData.agreement} onChange={e => setFormData({...formData, agreement: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" />
          </div>
          <div><label className="block text-xs font-black text-slate-700 uppercase mb-2">Grupo / Cadena</label>
            <input type="text" value={formData.group} onChange={e => setFormData({...formData, group: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none" />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button type="submit" disabled={isLoading} className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl shadow hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer">
            <Save size={18} className="inline mr-2"/> {isLoading ? 'Guardando...' : 'Crear Cliente'}
          </button>
        </div>
      </form>
    </div>
  );
};