import React, { useState, useEffect } from 'react';
import { ArrowLeft, Tag } from 'lucide-react';
import { api } from '../../config/api';

interface ProductFormProps {
  initialData: any | null;
  onSuccess: () => void;
  onCancel: () => void;
  setStatusMessage: (msg: string) => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSuccess, onCancel, setStatusMessage }) => {
  const isEditing = !!initialData;
  const [indForm, setIndForm] = useState({ 
    sku: '', name: '', category: '', is_active: true, is_promo: false, promo_price: 0 
  });

  // Carga los datos si estamos editando
  useEffect(() => {
    if (initialData) {
      setIndForm({
        sku: initialData.sku,
        name: initialData.name,
        category: initialData.category,
        is_active: initialData.is_active,
        is_promo: initialData.is_promo,
        promo_price: initialData.promo_price ? Number(initialData.promo_price) : 0
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products/individual', indForm);
      setStatusMessage(isEditing ? '¡Producto actualizado!' : '¡Producto creado!');
      onSuccess();
    } catch (err) {
      setStatusMessage('Error al guardar el producto.');
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-paper p-8 rounded-card shadow-sm border border-line mt-4">
      <button onClick={onCancel} className="text-ink-soft hover:text-ink text-xs font-bold flex items-center mb-6"><ArrowLeft size={14} className="mr-1"/> VOLVER AL LISTADO</button>
      <h2 className="text-xl font-black text-ink uppercase mb-6">{isEditing ? `Editar: ${indForm.sku}` : 'Crear Nuevo Artículo'}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-black text-ink-soft uppercase">SKU / Código</label>
          <input type="text" required disabled={isEditing} value={indForm.sku} onChange={e => setIndForm({...indForm, sku: e.target.value})} className="w-full mt-1 p-2.5 border border-line rounded-xl bg-bg text-sm disabled:opacity-50 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-black text-ink-soft uppercase">Nombre Comercial</label>
          <input type="text" required value={indForm.name} onChange={e => setIndForm({...indForm, name: e.target.value})} className="w-full mt-1 p-2.5 border border-line rounded-xl text-sm outline-none" />
        </div>
        <div>
          <label className="block text-xs font-black text-ink-soft uppercase">Rubro / Categoría</label>
          <input type="text" required value={indForm.category} onChange={e => setIndForm({...indForm, category: e.target.value})} className="w-full mt-1 p-2.5 border border-line rounded-xl text-sm outline-none" />
        </div>

        <div className="flex items-center justify-between p-4 bg-brand-gold/10 border border-brand-gold/30 rounded-xl mt-4">
          <label className="flex items-center space-x-2 cursor-pointer font-black text-brand-gold-deep text-xs uppercase">
            <input type="checkbox" checked={indForm.is_promo} onChange={e => setIndForm({...indForm, is_promo: e.target.checked})} className="form-checkbox h-4 w-4 text-brand-gold rounded" />
            <span><Tag size={14} className="inline mr-1"/> Destacar Promo</span>
          </label>
          {indForm.is_promo && (
            <input type="number" required={indForm.is_promo} value={indForm.promo_price} onChange={e => setIndForm({...indForm, promo_price: Number(e.target.value)})} className="w-32 p-2 border border-brand-gold/40 rounded-xl text-sm text-right font-bold outline-none" placeholder="Precio $" />
          )}
        </div>

        <button type="submit" className="w-full bg-brand-primary text-brand-primary-on py-3 rounded-xl font-bold hover:bg-brand-accent transition shadow mt-4 text-sm">{isEditing ? 'Guardar Cambios' : 'Insertar Producto'}</button>
      </form>
    </div>
  );
};