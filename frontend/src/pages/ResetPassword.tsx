import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { api } from '../config/api';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return setError('Debe tener al menos 8 caracteres.');
    setIsSubmitting(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo restablecer la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center p-6">
        <p className="text-sm text-ink-soft font-medium">Este enlace no es válido. Pedí uno nuevo desde la pantalla de inicio de sesión.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-paper rounded-card p-6 sm:p-8 shadow-xl border-2 border-brand-gold text-center">
      <div className="bg-brand-gold/15 p-3 rounded-full text-brand-gold-deep w-fit mx-auto mb-3"><Lock size={28} /></div>
      <h3 className="text-lg font-black text-brand-primary uppercase mb-2">Elegí tu nueva contraseña</h3>

      {success ? (
        <p className="text-sm text-ink font-medium">Contraseña actualizada. Redirigiendo al inicio...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left mt-4">
          <div>
            <label className="block text-[10px] font-bold text-ink-soft uppercase mb-1">Nueva Contraseña (mínimo 8 caracteres)</label>
            <input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 bg-bg border border-brand-gold/40 rounded-lg text-sm font-mono outline-none focus:border-brand-gold" required />
          </div>
          {error && <p className="text-xs text-danger font-bold">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full bg-brand-primary text-brand-primary-on py-3 rounded-lg font-bold text-sm hover:bg-brand-accent transition disabled:opacity-50">
            {isSubmitting ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      )}
    </div>
  );
};
