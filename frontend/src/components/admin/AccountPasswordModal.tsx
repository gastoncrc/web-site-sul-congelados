import React, { useState, useEffect } from 'react';
import { KeyRound, Copy } from 'lucide-react';
import { api } from '../../config/api';

interface AccountPasswordModalProps {
  account: { id: number; name?: string; email: string } | null;
  onClose: () => void;
  setSystemMessage: (msg: string) => void;
}

export const AccountPasswordModal: React.FC<AccountPasswordModalProps> = ({ account, onClose, setSystemMessage }) => {
  const [passwordMode, setPasswordMode] = useState<'menu' | 'choose'>('menu');
  const [chosenPassword, setChosenPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Resetea el estado interno cada vez que se abre para una cuenta distinta.
  useEffect(() => {
    setPasswordMode('menu');
    setChosenPassword('');
    setGeneratedPassword('');
  }, [account?.id]);

  if (!account) return null;

  const handleGeneratePassword = async () => {
    try {
      const response = await api.post(`/auth/users/${account.id}/generate-password`);
      setGeneratedPassword(response.data.password);
    } catch (err) {
      setSystemMessage('🚨 Error al generar la contraseña.');
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chosenPassword.length < 8) return setSystemMessage('🚨 La contraseña debe tener al menos 8 caracteres.');
    try {
      await api.post(`/auth/users/${account.id}/set-password`, { password: chosenPassword });
      setSystemMessage('✅ Contraseña actualizada. Se le pedirá cambiarla al ingresar.');
      onClose();
    } catch (err: any) {
      setSystemMessage(`🚨 ${err.response?.data?.error || 'Error al actualizar la contraseña.'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-paper w-full max-w-md rounded-card shadow-xl overflow-hidden">
        <div className="p-5 bg-brand-primary text-white flex justify-between items-center">
          <h3 className="font-black uppercase text-sm tracking-wider flex items-center">
            <KeyRound size={16} className="mr-2 text-brand-gold" /> Contraseña de {account.name || account.email}
          </h3>
          <button onClick={onClose} className="text-white/60 hover:text-white font-black">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {generatedPassword ? (
            <div className="space-y-3">
              <p className="text-xs text-ink-soft">Comunicásela al usuario ahora — no se va a volver a mostrar.</p>
              <div className="flex items-center gap-2 bg-bg border border-brand-gold/50 rounded-lg p-3">
                <span className="font-mono text-sm font-black text-ink flex-1 break-all">{generatedPassword}</span>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(generatedPassword); setSystemMessage('📋 Contraseña copiada al portapapeles.'); }}
                  className="text-ink-soft hover:text-ink cursor-pointer shrink-0"
                  title="Copiar"
                >
                  <Copy size={16} />
                </button>
              </div>
              <button type="button" onClick={onClose} className="w-full px-5 py-2.5 rounded-xl bg-brand-primary text-brand-primary-on font-bold text-xs hover:bg-brand-accent transition">Listo</button>
            </div>
          ) : passwordMode === 'menu' ? (
            <div className="space-y-3">
              <button type="button" onClick={handleGeneratePassword} className="w-full px-5 py-3 rounded-xl border border-line text-ink font-bold text-xs hover:bg-bg transition text-left">
                Generar automática
                <span className="block text-[10px] text-ink-soft font-normal mt-0.5">El sistema crea una contraseña segura. Se le pedirá cambiarla al ingresar.</span>
              </button>
              <button type="button" onClick={() => setPasswordMode('choose')} className="w-full px-5 py-3 rounded-xl border border-line text-ink font-bold text-xs hover:bg-bg transition text-left">
                Elegir una
                <span className="block text-[10px] text-ink-soft font-normal mt-0.5">Vos definís la contraseña. También se le pedirá cambiarla al ingresar.</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSetPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black text-ink-soft uppercase">Nueva contraseña (mínimo 8 caracteres)</label>
                <input type="text" required minLength={8} value={chosenPassword} onChange={e => setChosenPassword(e.target.value)} className="w-full mt-1 p-2 border border-line rounded bg-bg text-sm outline-none font-mono" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setPasswordMode('menu')} className="px-4 py-2 rounded-xl border border-line text-ink-soft font-bold text-xs hover:bg-bg transition">Volver</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-brand-primary text-brand-primary-on font-bold text-xs hover:bg-brand-accent transition">Guardar</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
