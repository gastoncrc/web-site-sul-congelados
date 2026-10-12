import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, ListOrdered } from 'lucide-react';
import { api } from '../../config/api';

interface CategoryOrderManagerProps {
  setSystemMessage: (msg: string) => void;
}

export const CategoryOrderManager: React.FC<CategoryOrderManagerProps> = ({ setSystemMessage }) => {
  const [order, setOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [categoriesRes, settingsRes] = await Promise.all([
          api.get('/products/categories'),
          api.get('/settings'),
        ]);
        const allCategories: string[] = categoriesRes.data;
        const saved: string[] = (settingsRes.data.category_order || '')
          .split(',').map((c: string) => c.trim()).filter(Boolean);
        const ordered = [
          ...saved.filter(c => allCategories.includes(c)),
          ...allCategories.filter(c => !saved.includes(c)),
        ];
        setOrder(ordered);
      } catch {
        setSystemMessage('🚨 Error al cargar las categorías.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  const handleSave = async () => {
    try {
      await api.post('/settings/update', { key: 'category_order', value: order.join(',') });
      setSystemMessage('✅ Orden de rubros guardado.');
    } catch {
      setSystemMessage('🚨 Error al guardar el orden.');
    }
  };

  if (isLoading) return <div className="text-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs text-ink-soft max-w-md">
          Así se ordenan los rubros en el filtro del catálogo (sitio público y Pedido Rápido). Los que no muevas quedan al final, en orden alfabético.
        </p>
        <button onClick={handleSave} className="bg-brand-primary text-brand-primary-on px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-accent transition cursor-pointer shrink-0">
          Guardar orden
        </button>
      </div>
      <div className="bg-paper border border-line rounded-card divide-y divide-line max-w-lg">
        {order.map((cat, i) => (
          <div key={cat} className="flex items-center gap-3 p-3">
            <ListOrdered size={14} className="text-ink-soft shrink-0" />
            <span className="text-sm font-bold text-ink flex-1">{cat}</span>
            <button onClick={() => move(i, -1)} disabled={i === 0} className="w-7 h-7 rounded-lg border border-line flex items-center justify-center text-ink-soft hover:border-brand-gold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
              <ArrowUp size={13} />
            </button>
            <button onClick={() => move(i, 1)} disabled={i === order.length - 1} className="w-7 h-7 rounded-lg border border-line flex items-center justify-center text-ink-soft hover:border-brand-gold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
              <ArrowDown size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
