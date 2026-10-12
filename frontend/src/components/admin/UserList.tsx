import React, { useState } from 'react';
import { UserCog, Edit3, KeyRound, Search, UserPlus } from 'lucide-react';
import { api } from '../../config/api';
import { AccountPasswordModal } from './AccountPasswordModal';

interface UserListProps {
  clientList: any[];
  setClientList: React.Dispatch<React.SetStateAction<any[]>>;
  setSystemMessage: (msg: string) => void;
  onDataChange: () => void;
}

const ROLES = ['Admin', 'Minorista', 'Vendedor'];
const EMPTY_NEW_USER = { email: '', password: '', role: 'Minorista', convenio: '', telefono: '' };

export const UserList: React.FC<UserListProps> = ({ clientList, setClientList, setSystemMessage, onDataChange }) => {
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [passwordClient, setPasswordClient] = useState<any | null>(null);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState(EMPTY_NEW_USER);

  const filteredUsers = clientList
    .filter(u => u.role !== 'Cliente')
    .filter(u => roleFilter === 'Todos' || u.role === roleFilter)
    .filter(u => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    });

  const handleToggleStatus = async (user: any) => {
    try {
      const nextActive = !user.is_active;
      await api.put(`/auth/users/${user.id}/status`, { is_active: nextActive });
      setClientList(prev => prev.map(c => c.id === user.id ? { ...c, is_active: nextActive } : c));
      setSystemMessage(nextActive ? '✅ Usuario reactivado.' : '✅ Usuario pausado.');
    } catch (err) {
      setSystemMessage('🚨 Error al cambiar el estado del usuario.');
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/admin-create-user', newUserForm);
      setSystemMessage('✅ Usuario creado exitosamente');
      setNewUserForm(EMPTY_NEW_USER);
      setShowNewUserModal(false);
      onDataChange();
    } catch (err: any) {
      setSystemMessage(`🚨 ${err.response?.data?.error || 'Error al crear usuario'}`);
    }
  };

  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const payload = {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        telefono: editingUser.telefono,
        // Campos comerciales que este formulario no toca: se reenvían tal cual estaban
        // para no perderlos si esta cuenta alguna vez tuvo datos de cliente cargados.
        convenio: editingUser.convenio,
        razon_social: editingUser.razon_social,
        cuit: editingUser.cuit,
        localidad: editingUser.localidad,
        provincia: editingUser.provincia,
        vendedor: editingUser.vendedor,
        grupo: editingUser.grupo,
        domicilio_facturacion: editingUser.domicilio_facturacion,
        dias_entrega: editingUser.dias_entrega,
      };

      const response = await api.put(`/auth/clients/${editingUser.id}`, payload);

      setSystemMessage(`✅ ${response.data.message || 'Usuario actualizado correctamente'}`);
      setClientList(prev => prev.map(c => c.id === editingUser.id ? { ...c, ...payload } : c));
      setEditingUser(null);
    } catch (err: any) {
      setSystemMessage(`🚨 ${err.response?.data?.error || 'Error al intentar actualizar el usuario.'}`);
    }
  };

  return (
    <>
      <div className="bg-paper p-6 rounded-card shadow-sm border border-line">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-black text-ink uppercase flex items-center">
            <UserCog className="mr-2 text-ink-soft"/> Usuarios
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-paper border border-line rounded-xl px-4 py-2 w-full sm:w-64 shadow-sm">
              <Search size={18} className="text-ink-soft mr-2" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button onClick={() => setShowNewUserModal(true)} className="bg-brand-primary text-brand-primary-on px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-accent transition cursor-pointer inline-flex items-center gap-1.5 shrink-0">
              <UserPlus size={14}/> Nuevo usuario
            </button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap mb-6">
          {['Todos', ...ROLES].map(r => (
            <button
              key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer border ${roleFilter === r ? 'bg-brand-primary text-brand-primary-on border-brand-primary' : 'bg-bg text-ink-soft border-line hover:bg-line/40'}`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-bg text-xs font-black text-ink-soft uppercase">
                <th className="p-3">Nombre</th>
                <th className="p-3">Email</th>
                <th className="p-3">Rol</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-line">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink-soft font-medium">No hay usuarios para este filtro.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className={`hover:bg-bg transition-colors ${!u.is_active ? 'opacity-60' : ''}`}>
                    <td className="p-3 font-bold text-ink">{u.name || '-'}</td>
                    <td className="p-3 text-ink-soft font-mono text-xs">{u.email}</td>
                    <td className="p-3">
                      <span className="bg-line/60 text-ink-soft px-2.5 py-1 rounded-md text-xs font-black border border-line uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {u.is_active ?
                        <span className="bg-success/10 text-success border border-success/30 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase">Activa</span> :
                        <span className="bg-danger/10 text-danger border border-danger/30 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase">Pausada</span>
                      }
                    </td>
                    <td className="p-3 text-center space-x-2 whitespace-nowrap">
                      <button onClick={() => setEditingUser({ ...u })} className="bg-line/60 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-primary hover:text-brand-primary-on transition cursor-pointer">Editar</button>
                      <button onClick={() => setPasswordClient(u)} className="bg-line/60 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-gold hover:text-brand-gold-on transition cursor-pointer inline-flex items-center gap-1">
                        <KeyRound size={12}/> Contraseña
                      </button>
                      {u.is_active ? (
                        <button onClick={() => handleToggleStatus(u)} className="bg-danger/10 text-danger border border-danger/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-danger hover:text-white transition cursor-pointer">Pausar</button>
                      ) : (
                        <button onClick={() => handleToggleStatus(u)} className="bg-success/10 text-success border border-success/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-success hover:text-white transition cursor-pointer">Reactivar</button>
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

      {showNewUserModal && (
        <div className="fixed inset-0 bg-neutral-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper w-full max-w-lg rounded-card shadow-xl overflow-hidden">
            <div className="p-5 bg-brand-primary text-white flex justify-between items-center">
              <h3 className="font-black uppercase text-sm tracking-wider flex items-center">
                <UserPlus size={16} className="mr-2 text-brand-gold" /> Nuevo Usuario
              </h3>
              <button onClick={() => setShowNewUserModal(false)} className="text-white/60 hover:text-white font-black cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateUserSubmit} className="p-6 space-y-4 text-left">
              <div><label className="block text-[11px] font-black text-ink-soft uppercase">Email *</label><input type="email" required value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none font-mono" /></div>
              <div><label className="block text-[11px] font-black text-ink-soft uppercase">Contraseña *</label><input type="password" required value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none" /></div>
              <div>
                <label className="block text-[11px] font-black text-ink-soft uppercase">Rol *</label>
                <select required value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none">
                  <option value="Admin">Admin</option>
                  <option value="Minorista">Minorista</option>
                  <option value="Vendedor">Vendedor</option>
                </select>
                {newUserForm.role === 'Vendedor' && <p className="text-[10px] text-ink-soft mt-1">El email se usa como login; el nombre para la cartera se completa luego editando la cuenta.</p>}
              </div>
              {newUserForm.role === 'Minorista' && (
                <div>
                  <label className="block text-[11px] font-black text-ink-soft uppercase">Lista de Precios</label>
                  <input type="text" value={newUserForm.convenio} onChange={e => setNewUserForm({...newUserForm, convenio: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none" placeholder="Dejalo vacío para usar la lista por defecto" />
                </div>
              )}
              <div><label className="block text-[11px] font-black text-ink-soft uppercase">Teléfono</label><input type="text" value={newUserForm.telefono} onChange={e => setNewUserForm({...newUserForm, telefono: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none" /></div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowNewUserModal(false)} className="px-5 py-2.5 rounded-xl border border-line text-ink-soft font-bold text-xs hover:bg-bg transition">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-primary text-brand-primary-on font-bold text-xs hover:bg-brand-accent transition shadow">Crear Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-neutral-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper w-full max-w-lg rounded-card shadow-xl overflow-hidden">
            <div className="p-5 bg-brand-primary text-white flex justify-between items-center">
              <h3 className="font-black uppercase text-sm tracking-wider flex items-center">
                <Edit3 size={16} className="mr-2 text-brand-gold" /> Editar Usuario
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-white/60 hover:text-white font-black">✕</button>
            </div>

            <form onSubmit={handleUpdateUserSubmit} className="p-6 space-y-4 text-left">
              <div><label className="block text-[11px] font-black text-ink-soft uppercase">Nombre *</label><input type="text" required value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none" /></div>
              <div><label className="block text-[11px] font-black text-ink-soft uppercase">Email (usado para el login) *</label><input type="email" required value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none font-mono" /></div>
              <div>
                <label className="block text-[11px] font-black text-ink-soft uppercase">Rol *</label>
                <select required value={editingUser.role || 'Minorista'} onChange={e => setEditingUser({...editingUser, role: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none">
                  {/* Si el rol guardado es viejo/no estándar (ej. "Mayorista" de antes de los
                      4 roles actuales), se muestra tal cual en vez de que el <select> caiga
                      silenciosamente en la primera opción de la lista sin que nadie lo note. */}
                  {!ROLES.includes(editingUser.role) && editingUser.role && (
                    <option value={editingUser.role}>{editingUser.role} (rol no estándar — elegí uno real)</option>
                  )}
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {editingUser.role === 'Vendedor' && <p className="text-[10px] text-ink-soft mt-1">El nombre tiene que coincidir exacto con el campo "Vendedor" de sus clientes asignados, para que vea su cartera.</p>}
              </div>
              <div><label className="block text-[11px] font-black text-ink-soft uppercase">Teléfono</label><input type="text" value={editingUser.telefono || ''} onChange={e => setEditingUser({...editingUser, telefono: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none" /></div>
              {editingUser.role === 'Minorista' && (
                <div>
                  <label className="block text-[11px] font-black text-ink-soft uppercase">Lista de Precios</label>
                  <input type="text" value={editingUser.convenio || ''} onChange={e => setEditingUser({...editingUser, convenio: e.target.value})} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none" placeholder="Ej: Gastronomica" />
                  <p className="text-[10px] text-ink-soft mt-1">Tiene que ser el nombre exacto de una lista real para que vea productos en el catálogo.</p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setEditingUser(null)} className="px-5 py-2.5 rounded-xl border border-line text-ink-soft font-bold text-xs hover:bg-bg transition">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-primary text-brand-primary-on font-bold text-xs hover:bg-brand-accent transition shadow">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
