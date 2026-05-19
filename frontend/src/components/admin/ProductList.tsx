import React, { useState } from 'react';
import { Search, Power, PowerOff } from 'lucide-react';
import { api } from '../../config/api';

interface ProductListProps {
  products: any[];
  onRefresh: () => Promise<void>;
  setSystemMessage: (msg: string) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, onRefresh, setSystemMessage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isShowingInactive, setIsShowingInactive] = useState(false);

  // Filtrado de la tabla (Buscador en tiempo real)
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = isShowingInactive ? true : p.is_active;
    return matchesSearch && matchesStatus;
  });

  const handleToggleProductStatus = async (sku: string, currentStatus: boolean) => {
    try {
      await api.patch(`/products/${sku}/flags`, { is_active: !currentStatus });
      setSystemMessage(!currentStatus ? 'Producto Reactivado' : 'Producto Pausado');
      await onRefresh();
    } catch (err) {
      setSystemMessage('Error al cambiar el estado del producto.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-black text-slate-900 uppercase">Listado de Productos</h1>
        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 w-full sm:w-96 shadow-sm">
          <Search size={18} className="text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Buscar por código o nombre..." 
            className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={isShowingInactive} onChange={e => setIsShowingInactive(e.target.checked)} className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
            <span className="text-xs font-bold text-slate-600 uppercase">Mostrar Inactivos</span>
          </label>
        </div>

        <div className="overflow-x-auto max-h-150 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Artículo</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acción rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(p => (
                <tr key={p.sku} className={`hover:bg-slate-50/80 transition ${!p.is_active ? 'bg-slate-100/50 opacity-60' : ''}`}>
                  <td className="px-6 py-4 font-mono font-bold text-slate-400">{p.sku}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                  <td className="px-6 py-4 text-center">
                    {p.is_active ? 
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-black inline-flex items-center"><Power size={10} className="mr-1"/> ACTIVO</span> : 
                      <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-black inline-flex items-center"><PowerOff size={10} className="mr-1"/> INACTIVO</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleToggleProductStatus(p.sku, p.is_active)} className={`${p.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'} p-2 rounded-lg transition`}>
                      {p.is_active ? <PowerOff size={16}/> : <Power size={16}/>}
                    </button>
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