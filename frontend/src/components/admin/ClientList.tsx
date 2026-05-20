import React, { useState } from 'react';
import { Users, Edit3, Calendar } from 'lucide-react';
import { api } from '../../config/api';

interface ClientListProps {
  clientList: any[];
  setClientList: React.Dispatch<React.SetStateAction<any[]>>;
  setSystemMessage: React.Dispatch<React.SetStateAction<string>>;
}

export const ClientList: React.FC<ClientListProps> = ({ clientList, setClientList, setSystemMessage }) => {
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const diasSemana = [
    { id: 'Lunes', label: 'LU' }, { id: 'Martes', label: 'MA' }, { id: 'Miércoles', label: 'MI' },
    { id: 'Jueves', label: 'JU' }, { id: 'Viernes', label: 'VI' }, { id: 'Sábado', label: 'SA' }, { id: 'Domingo', label: 'DO' }
  ];

  const handleEditClick = (client: any) => {
    const days = client.dias_entrega 
      ? (typeof client.dias_entrega === 'string' ? client.dias_entrega.split(',') : client.dias_entrega) 
      : [];
    setSelectedDays(days);
    setEditingClient({ ...client });
  };

  const handleDayToggle = (dayId: string) => {
    setSelectedDays(prev => prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]);
  };

  const handleUpdateClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    try {
      // 🚀 UNIFICAMOS PROPIEDADES EN SNAKE_CASE PARA EVITAR EL RECHAZO DE LA DB
      const payload = {
        name: editingClient.name,
        convenio: editingClient.convenio,
        razon_social: editingClient.razon_social,
        cuit: editingClient.cuit,
        localidad: editingClient.localidad,
        provincia: editingClient.provincia,
        telefono: editingClient.telefono,
        vendedor: editingClient.vendedor,
        grupo: editingClient.grupo,
        domicilio_facturacion: editingClient.domicilio_facturacion,
        dias_entrega: selectedDays.join(',') // Se guarda como string separado por comas
      };

      const response = await api.put(`/auth/clients/${editingClient.id}`, payload);

      setSystemMessage(`✅ ${response.data.message || 'Cliente actualizado correctamente'}`);
      setClientList(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...payload } : c));
      setEditingClient(null); 
    } catch (err) {
      setSystemMessage('🚨 Error al intentar actualizar los datos del cliente. Revisá los campos obligatorios.');
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-black text-slate-900 uppercase mb-6 flex items-center">
          <Users className="mr-2 text-slate-400"/> Gestión CRM - Clientes Registrados
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black text-slate-500 uppercase">
                <th className="p-3">Nombre Comercial / Razón Social</th>
                <th className="p-3">Convenio</th>
                <th className="p-3">Días de Reparto</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {clientList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">No hay clientes registrados.</td>
                </tr>
              ) : (
                clientList.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <span className="font-bold text-slate-950 block">{client.name}</span>
                      <span className="text-xs text-slate-400 font-medium">{client.razon_social || '-'}</span>
                    </td>
                    <td className="p-3">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-black border border-blue-100">
                        {client.convenio || 'GENERAL'}
                      </span>
                    </td>
                    <td className="p-3 text-xs font-bold text-slate-600">
                      {client.dias_entrega ? (
                        <div className="flex gap-1">
                          {client.dias_entrega.split(',').map((d: string) => (
                            <span key={d} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700 uppercase">{d.substring(0,2)}</span>
                          ))}
                        </div>
                      ) : <span className="text-slate-400 font-normal">Sin días asignados</span>}
                    </td>
                    <td className="p-3 text-center space-x-2 whitespace-nowrap">
                      <button onClick={() => handleEditClick(client)} className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-900 hover:text-white transition cursor-pointer">Editar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-black uppercase text-sm tracking-wider flex items-center">
                <Edit3 size={16} className="mr-2 text-[#deff9a]" /> Editar Cuenta Comercial
              </h3>
              <button onClick={() => setEditingClient(null)} className="text-slate-400 hover:text-white font-black">✕</button>
            </div>

            <form onSubmit={handleUpdateClientSubmit} className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="md:col-span-2"><h4 className="text-xs font-bold text-slate-400 uppercase">Datos Comerciales</h4><hr className="mt-1 border-slate-100"/></div>
              
              <div><label className="block text-[11px] font-black text-slate-700 uppercase">Nombre de Fantasía *</label><input type="text" required value={editingClient.name || ''} onChange={e => setEditingClient({...editingClient, name: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" /></div>
              <div><label className="block text-[11px] font-black text-slate-700 uppercase">Razón Social</label><input type="text" value={editingClient.razon_social || ''} onChange={e => setEditingClient({...editingClient, razon_social: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" /></div>
              <div><label className="block text-[11px] font-black text-slate-700 uppercase">CUIT</label><input type="text" value={editingClient.cuit || ''} onChange={e => setEditingClient({...editingClient, cuit: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" /></div>
              <div><label className="block text-[11px] font-black text-slate-700 uppercase">Convenio Asignado *</label><input type="text" required value={editingClient.convenio || ''} onChange={e => setEditingClient({...editingClient, convenio: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" /></div>
              <div><label className="block text-[11px] font-black text-slate-700 uppercase">Grupo</label><input type="text" value={editingClient.grupo || ''} onChange={e => setEditingClient({...editingClient, grupo: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" /></div>
              <div><label className="block text-[11px] font-black text-slate-700 uppercase">Vendedor</label><input type="text" value={editingClient.vendedor || ''} onChange={e => setEditingClient({...editingClient, vendedor: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" /></div>

              <div className="md:col-span-2 mt-2"><h4 className="text-xs font-bold text-slate-400 uppercase">Datos Logísticos</h4><hr className="mt-1 border-slate-100"/></div>

              <div className="md:col-span-2"><label className="block text-[11px] font-black text-slate-700 uppercase">Domicilio de Entrega *</label><input type="text" required value={editingClient.domicilio_facturacion || ''} onChange={e => setEditingClient({...editingClient, domicilio_facturacion: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" /></div>
              <div><label className="block text-[11px] font-black text-slate-700 uppercase">Localidad *</label><input type="text" required value={editingClient.localidad || ''} onChange={e => setEditingClient({...editingClient, localidad: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" /></div>
              <div><label className="block text-[11px] font-black text-slate-700 uppercase">Provincia *</label><input type="text" required value={editingClient.provincia || ''} onChange={e => setEditingClient({...editingClient, provincia: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" /></div>
              <div><label className="block text-[11px] font-black text-slate-700 uppercase">Teléfono *</label><input type="text" required value={editingClient.telefono || ''} onChange={e => setEditingClient({...editingClient, telefono: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" /></div>

              {/* 🚀 SELECTOR COMPACTO EN EDICIÓN */}
              <div className="md:col-span-2 pt-4 border-t border-slate-100">
                <label className="flex text-xs font-black text-slate-700 uppercase mb-3 items-center">
                  <Calendar size={14} className="mr-1 text-slate-900" /> Días de Reparto Habilitados
                </label>
                <div className="flex flex-wrap gap-2">
                  {diasSemana.map(day => (
                    <button key={day.id} type="button" onClick={() => handleDayToggle(day.id)} 
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all border cursor-pointer flex items-center justify-center ${selectedDays.includes(day.id) ? 'bg-slate-900 text-[#deff9a] border-slate-900 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-2 mt-4 shrink-0">
                <button type="button" onClick={() => setEditingClient(null)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};