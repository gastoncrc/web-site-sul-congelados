import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { api } from '../../config/api';

interface ClientFormProps {
  setSystemMessage: (msg: string) => void;
}

interface ClientFormData {
  tradeName: string;
  businessName: string;
  taxId: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  seller: string;
  agreement: string;
  group: string;
}

export const ClientForm: React.FC<ClientFormProps> = ({ setSystemMessage }) => {
  const [clientForm, setClientForm] = useState<ClientFormData>({ 
    tradeName: '', businessName: '', taxId: '', address: '', city: '', province: '', 
    phone: '', email: '', seller: '', agreement: '', group: '' 
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClientSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSystemMessage('Creando cuenta de cliente...');
    
    try {
      const response = await api.post('/auth/register-client-admin', clientForm);
      setSystemMessage(`✅ ${response.data.message}`);
      
      // Limpiamos el formulario tras un registro exitoso
      setClientForm({ 
        tradeName: '', businessName: '', taxId: '', address: '', city: '', province: '', 
        phone: '', email: '', seller: '', agreement: '', group: '' 
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error de conexión con el servidor.';
      setSystemMessage(`🚨 Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-black text-slate-900 uppercase mb-6 flex items-center">
        <Users className="mr-2 text-slate-400"/> Alta Individual de Cliente
      </h2>
      <form onSubmit={handleClientSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="md:col-span-2">
          <hr className="my-2 border-slate-100"/> 
          <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase">Datos Comerciales</h3>
        </div>
        
        <div>
          <label className="block text-[11px] font-black text-slate-700 uppercase">Nombre de Fantasía *</label>
          <input type="text" required value={clientForm.tradeName} onChange={e => setClientForm({...clientForm, tradeName: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-[11px] font-black text-slate-700 uppercase">Razón Social</label>
          <input type="text" value={clientForm.businessName} onChange={e => setClientForm({...clientForm, businessName: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-[11px] font-black text-slate-700 uppercase">CUIT</label>
          <input type="text" value={clientForm.taxId} onChange={e => setClientForm({...clientForm, taxId: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-[11px] font-black text-slate-700 uppercase">Convenio Asignado *</label>
          <input type="text" required value={clientForm.agreement} onChange={e => setClientForm({...clientForm, agreement: e.target.value})} placeholder="Ej: 2X1 CORDOBA" className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-[11px] font-black text-slate-700 uppercase">Grupo *</label>
          <input type="text" required value={clientForm.group} onChange={e => setClientForm({...clientForm, group: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-[11px] font-black text-slate-700 uppercase">Vendedor *</label>
          <input type="text" required value={clientForm.seller} onChange={e => setClientForm({...clientForm, seller: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" />
        </div>

        <div className="md:col-span-2">
          <hr className="my-2 border-slate-100"/> 
          <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase">Datos Logísticos y Contacto</h3>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11px] font-black text-slate-700 uppercase">Domicilio de Entrega *</label>
          <input type="text" required value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-[11px] font-black text-slate-700 uppercase">Localidad *</label>
          <input type="text" required value={clientForm.city} onChange={e => setClientForm({...clientForm, city: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-[11px] font-black text-slate-700 uppercase">Provincia *</label>
          <input type="text" required value={clientForm.province} onChange={e => setClientForm({...clientForm, province: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-[11px] font-black text-slate-700 uppercase">Teléfono *</label>
          <input type="text" required value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-[11px] font-black text-slate-700 uppercase">Email (Usuario Web) *</label>
          <input type="email" required value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="w-full mt-1 p-2 border border-blue-200 rounded bg-blue-50 text-sm outline-none" />
          <p className="text-[10px] text-slate-400 mt-1">Se generará una contraseña aleatoria y se exigirá el cambio al primer ingreso.</p>
        </div>

        <div className="md:col-span-2 mt-6">
          <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition shadow disabled:opacity-50 flex justify-center">
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              "Generar Cuenta de Cliente"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};