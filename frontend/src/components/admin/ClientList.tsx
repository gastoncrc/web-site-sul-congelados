import React, { useState } from 'react';
import { Users, Edit3, Calendar, KeyRound, Search } from 'lucide-react';
import { api } from '../../config/api';
import { AccountPasswordModal } from './AccountPasswordModal';

interface ClientListProps {
  clientList: any[];
  setClientList: React.Dispatch<React.SetStateAction<any[]>>;
  setSystemMessage: React.Dispatch<React.SetStateAction<string>>;
}

export const ClientList: React.FC<ClientListProps> = ({ clientList, setClientList, setSystemMessage }) => {
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [passwordClient, setPasswordClient] = useState<any | null>(null);

  const filteredClients = clientList
    .filter(c => c.role === 'Cliente')
    .filter(c => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (c.name || '').toLowerCase().includes(q)
        || (c.email || '').toLowerCase().includes(q)
        || (c.razon_social || '').toLowerCase().includes(q)
        || (c.cuit || '').toLowerCase().includes(q);
    });

  const handleToggleStatus = async (client: any) => {
    try {
      const nextActive = !client.is_active;
      await api.put(`/auth/users/${client.id}/status`, { is_active: nextActive });
      setClientList(prev => prev.map(c => c.id === client.id ? { ...c, is_active: nextActive } : c));
      setSystemMessage(nextActive ? '✅ Cliente reactivado.' : '✅ Cliente pausado.');
    } catch (err) {
      setSystemMessage('🚨 Error al cambiar el estado del cliente.');
    }
  };

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
        email: editingClient.email,
        role: 'Cliente',
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
    } catch (err: any) {
      setSystemMessage(`🚨 ${err.response?.data?.error || 'Error al intentar actualizar los datos del cliente. Revisá los campos obligatorios.'}`);
    }
  };

  return (
    <>
      <div className="bg-paper p-6 rounded-card shadow-sm border border-line">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-black text-ink uppercase flex items-center">
            <Users className="mr-2 text-ink-soft"/> Gestión CRM - Clientes
          </h2>
          <div className="flex items-center bg-paper border border-line rounded-xl px-4 py-2 w-full sm:w-80 shadow-sm">
            <Search size={18} className="text-ink-soft mr-2" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, razón social o CUIT..."
              className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-bg text-xs font-black text-ink-soft uppercase">
                <th className="p-3">Nombre Comercial / Razón Social</th>
                <th className="p-3">Convenio</th>
                <th className="p-3">Días de Reparto</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-line">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink-soft font-medium">No hay clientes para esta búsqueda.</td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className={`hover:bg-bg transition-colors ${!client.is_active ? 'opacity-60' : ''}`}>
                    <td className="p-3">
                      <span className="font-bold text-ink block">{client.name || client.email}</span>
                      <span className="text-xs text-ink-soft font-medium">{client.razon_social || '-'}</span>
                    </td>
                    <td className="p-3">
                      <span className="bg-brand-accent/10 text-brand-accent px-2.5 py-1 rounded-md text-xs font-black border border-brand-accent/20">
                        {client.convenio || 'GENERAL'}
                      </span>
                    </td>
                    <td className="p-3 text-xs font-bold text-ink-soft">
                      {client.dias_entrega ? (
                        <div className="flex gap-1">
                          {client.dias_entrega.split(',').map((d: string) => (
                            <span key={d} className="bg-line/60 px-1.5 py-0.5 rounded text-[10px] text-ink-soft uppercase">{d.substring(0,2)}</span>
                          ))}
                        </div>
                      ) : <span className="text-ink-soft font-normal">Sin días asignados</span>}
                    </td>
                    <td className="p-3 text-center">
                      {client.is_active ?
                        <span className="bg-success/10 text-success border border-success/30 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase">Activa</span> :
                        <span className="bg-danger/10 text-danger border border-danger/30 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase">Pausada</span>
                      }
                    </td>
                    <td className="p-3 text-center space-x-2 whitespace-nowrap">
                      <button onClick={() => handleEditClick(client)} className="bg-line/60 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-primary hover:text-brand-primary-on transition cursor-pointer">Editar</button>
                      <button onClick={() => setPasswordClient(client)} className="bg-line/60 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-gold hover:text-brand-gold-on transition cursor-pointer inline-flex items-center gap-1">
                        <KeyRound size={12}/> Contraseña
                      </button>
                      {client.is_active ? (
                        <button onClick={() => handleToggleStatus(client)} className="bg-danger/10 text-danger border border-danger/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-danger hover:text-white transition cursor-pointer">Pausar</button>
                      ) : (
                        <button onClick={() => handleToggleStatus(client)} className="bg-success/10 text-success border border-success/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-success hover:text-white transition cursor-pointer">Reactivar</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AccountPasswordModal account={passwordClient} onClose={() => setPasswordClient(null)} setSystemMessage={setSystemMessage} />

      {editingClient && (
        <div className="fixed inset-0 bg-neutral-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper w-full max-w-3xl rounded-card shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-brand-primary text-white flex justify-between items-center">
              <h3 className="font-black uppercase text-sm tracking-wider flex items-center">
                <Edit3 size={16} className="mr-2 text-brand-gold" /> Editar Cliente
              </h3>
              <button onClick={() => setEditingClient(null)} className="text-white/60 hover:text-white font-black">✕</button>
            </div>

            <form onSubmit={handleUpdateClientSubmit} className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="md:col-span-2"><h4 className="text-xs font-bold text-ink-soft uppercase">Datos Comerciales</h4><hr className="mt-1 border-line"/></div>

              <div><label className="block text-[11px] font-black text-ink-soft uppercase">Nombre de Fantasía *</label><input type="text" required value={editingClient.name || ''} onChange={e => setEditingClient({...editingClient, name: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none" /></div>
              <div>
                <label className="block text-[11px] font-black text-ink-soft uppercase">Email (usado para el login) *</label>
                <input type="email" required value={editingClient.email || ''} onChange={e => setEditingClient({...editingClient, email: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none font-mono" />
                <p className="text-[10px] text-ink-soft mt-1">Si viene de la carga masiva es un email generado (ej. cl_80012345@sul.com) — cambialo a uno real para que el cliente pueda usar "olvidé mi contraseña".</p>
              </div>
              <div><label className="block text-[11px] font-black text-ink-soft uppercase">Razón Social</label><input type="text" value={editingClient.razon_social || ''} onChange={e => setEditingClient({...editingClient, razon_social: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none" /></div>
              <div><label className="block text-[11px] font-black text-ink-soft uppercase">CUIT</label><input type="text" value={editingClient.cuit || ''} onChange={e => setEditingClient({...editingClient, cuit: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none" /></div>
              <div><label className="block text-[11px] font-black text-ink-soft uppercase">Convenio Asignado *</label><input type="text" required value={editingClient.convenio || ''} onChange={e => setEditingClient({...editingClient, convenio: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none" /></div>
              <div><label className="block text-[11px] font-black text-ink-soft uppercase">Grupo</label><input type="text" value={editingClient.grupo || ''} onChange={e => setEditingClient({...editingClient, grupo: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none" /></div>
              <div><label className="block text-[11px] font-black text-ink-soft uppercase">Vendedor</label><input type="text" value={editingClient.vendedor || ''} onChange={e => setEditingClient({...editingClient, vendedor: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none" /></div>

              <div className="md:col-span-2 mt-2"><h4 className="text-xs font-bold text-ink-soft uppercase">Datos Logísticos</h4><hr className="mt-1 border-line"/></div>

              <div className="md:col-span-2"><label className="block text-[11px] font-black text-ink-soft uppercase">Domicilio de Entrega *</label><input type="text" required value={editingClient.domicilio_facturacion || ''} onChange={e => setEditingClient({...editingClient, domicilio_facturacion: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none" /></div>
              <div><label className="block text-[11px] font-black text-ink-soft uppercase">Localidad *</label><input type="text" required value={editingClient.localidad || ''} onChange={e => setEditingClient({...editingClient, localidad: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none" /></div>
              <div><label className="block text-[11px] font-black text-ink-soft uppercase">Provincia *</label><input type="text" required value={editingClient.provincia || ''} onChange={e => setEditingClient({...editingClient, provincia: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none" /></div>
              <div><label className="block text-[11px] font-black text-ink-soft uppercase">Teléfono *</label><input type="text" required value={editingClient.telefono || ''} onChange={e => setEditingClient({...editingClient, telefono: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none" /></div>

              {/* 🚀 SELECTOR COMPACTO EN EDICIÓN */}
              <div className="md:col-span-2 pt-4 border-t border-line">
                <label className="flex text-xs font-black text-ink-soft uppercase mb-3 items-center">
                  <Calendar size={14} className="mr-1 text-brand-primary" /> Días de Reparto Habilitados
                </label>
                <div className="flex flex-wrap gap-2">
                  {diasSemana.map(day => (
                    <button key={day.id} type="button" onClick={() => handleDayToggle(day.id)}
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all border cursor-pointer flex items-center justify-center ${selectedDays.includes(day.id) ? 'bg-brand-gold text-brand-gold-on border-brand-gold shadow-sm' : 'bg-paper text-ink-soft border-line hover:bg-bg'}`}>
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-2 mt-4 shrink-0">
                <button type="button" onClick={() => setEditingClient(null)} className="px-5 py-2.5 rounded-xl border border-line text-ink-soft font-bold text-xs hover:bg-bg transition">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-primary text-brand-primary-on font-bold text-xs hover:bg-brand-accent transition shadow">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
