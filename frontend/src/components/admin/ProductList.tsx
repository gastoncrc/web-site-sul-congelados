import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { api } from '../../config/api';

interface ProductListProps {
  products: any[];
  onEdit: (product: any) => void;
  onRefresh: () => Promise<void>;
  setStatusMessage: (msg: string) => void;
  onCreateNew: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onRefresh, setStatusMessage, onCreateNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (showInactive ? true : p.is_active);
  });

  const handleToggleActive = async (sku: string, currentStatus: boolean) => {
    try {
      await api.patch(`/products/${sku}/flags`, { is_active: !currentStatus });
      setStatusMessage(!currentStatus ? 'Producto Reactivado' : 'Producto Pausado');
      await onRefresh();
    } catch (err) {
      setStatusMessage('Error al cambiar el estado.');
    }
  };

  const handleDelete = async (sku: string) => {
    if (!window.confirm(`¿Seguro de ELIMINAR el SKU ${sku}?`)) return;
    try {
      await api.delete(`/products/${sku}`);
      setStatusMessage('Producto eliminado.');
      await onRefresh();
    } catch (err) {
      setStatusMessage('Error al eliminar.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-black text-slate-900 uppercase">Artículos en Base</h1>
        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 w-full sm:w-96 shadow-sm">
          <Search size={18} className="text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Buscar por SKU o Nombre..." 
            className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded border-slate-300 text-slate-950 focus:ring-slate-950" />
            <span className="text-xs font-bold text-slate-600 uppercase">Ver Inactivos</span>
          </label>
          <button onClick={onCreateNew} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center hover:bg-slate-800 transition shadow">
            <Plus size={14} className="mr-2"/> NUEVO ARTÍCULO
          </button>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Artículo</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(p => (
                <tr key={p.sku} className={`hover:bg-slate-50/80 transition ${!p.is_active ? 'bg-slate-100/50 opacity-60' : ''}`}>
                  <td className="px-6 py-4 font-mono font-bold text-slate-400">{p.sku}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${!p.is_active ? 'line-through text-slate-400' : 'text-slate-900'}`}>{p.name}</span>
                    {p.is_promo && <span className="ml-2 bg-orange-100 text-orange-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Promo</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{p.category}</td>
                  <td className="px-6 py-4 text-center">
                    {p.is_active ? 
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-black inline-flex items-center"><Power size={10} className="mr-1"/> ACTIVO</span> : 
                      <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-black inline-flex items-center"><PowerOff size={10} className="mr-1"/> PAUSADO</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => onEdit(p)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"><Edit size={16}/></button>
                    <button onClick={() => handleToggleActive(p.sku, p.is_active)} className={`${p.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'} p-2 rounded-lg transition`}>{p.is_active ? <PowerOff size={16}/> : <Power size={16}/>}</button>
                    <button onClick={() => handleDelete(p.sku)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};