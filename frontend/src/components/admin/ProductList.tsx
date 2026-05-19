import React, { useState } from 'react';
import { Search, Edit3 } from 'lucide-react';
import { api } from '../../config/api';

interface ProductListProps {
  products: any[];
  onRefresh: () => Promise<void>;
  setSystemMessage: (msg: string) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, onRefresh, setSystemMessage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isShowingInactive, setIsShowingInactive] = useState(false);
  
  // 🚀 ESTADO PARA EL MODAL DE EDICIÓN DE PRODUCTO
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Filtrado de la tabla (Buscador en tiempo real)
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = isShowingInactive ? true : p.is_active;
    return matchesSearch && matchesStatus;
  });

  // Toggle rápido de Activo/Inactivo
  const handleToggleProductStatus = async (sku: string, currentStatus: boolean) => {
    try {
      await api.patch(`/products/${sku}/flags`, { is_active: !currentStatus });
      setSystemMessage(!currentStatus ? '✅ Producto Reactivado' : '✅ Producto Pausado');
      await onRefresh();
    } catch (err) {
      setSystemMessage('🚨 Error al cambiar el estado del producto.');
    }
  };

  // Guardar la edición completa del producto
  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      await api.post(`/products/individual`, {
        sku: editingProduct.sku,
        name: editingProduct.name,
        category: editingProduct.category,
        subcategory: editingProduct.subcategory,
        is_active: editingProduct.is_active,
        is_promo: editingProduct.is_promo,
        promo_price: parseFloat(editingProduct.promo_price) || 0
      });
      
      setSystemMessage(`✅ Datos del producto actualizados.`);
      await onRefresh();
      setEditingProduct(null); 
    } catch (err) {
      setSystemMessage('🚨 Error al intentar actualizar el producto.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-black text-slate-900 uppercase">Catálogo de Productos</h1>
        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 w-full sm:w-96 shadow-sm">
          <Search size={18} className="text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Buscar por código SKU o nombre..." 
            className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={isShowingInactive} onChange={e => setIsShowingInactive(e.target.checked)} className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Mostrar Inactivos</span>
          </label>
          <span className="text-xs font-bold text-slate-400">{filteredProducts.length} Artículos</span>
        </div>

        {/* 🚀 CORRECCIÓN: Optimizamos a max-h-150 */}
        <div className="overflow-x-auto max-h-150 overflow-y-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-100 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Artículo</th>
                <th className="px-6 py-4">Rubro / Categoría</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No se encontraron productos con esos filtros.</td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.sku} className={`hover:bg-slate-50 transition-colors ${!p.is_active ? 'bg-slate-50/50 opacity-60' : ''}`}>
                    <td className="px-6 py-4 font-mono font-bold text-slate-400 text-xs">{p.sku}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block">{p.name}</span>
                      {p.is_promo && <span className="text-[9px] bg-amber-100 text-amber-700 font-black px-1.5 py-0.5 rounded uppercase">En Promo</span>}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{p.category}</td>
                    <td className="px-6 py-4 text-center">
                      {p.is_active ? 
                        <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase">Activo</span> : 
                        <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase">Inactivo</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap">
                      <button 
                        onClick={() => setEditingProduct({ ...p })}
                        className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-slate-900 hover:text-white transition cursor-pointer"
                      >
                        Editar
                      </button>
                      
                      {p.is_active ? (
                        <button 
                          onClick={() => handleToggleProductStatus(p.sku, p.is_active)}
                          className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition cursor-pointer"
                        >
                          Pausar
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleToggleProductStatus(p.sku, p.is_active)}
                          className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-green-600 hover:text-white transition cursor-pointer"
                        >
                          Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-black uppercase text-sm tracking-wider flex items-center">
                <Edit3 size={16} className="mr-2 text-[#deff9a]" /> Editar Producto
              </h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-white font-black text-sm">✕</button>
            </div>

            <form onSubmit={handleUpdateProductSubmit} className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase">Código SKU (No editable)</label>
                <input type="text" disabled value={editingProduct.sku || ''} className="w-full mt-1 p-2 border rounded bg-slate-100 text-sm text-slate-500 outline-none font-mono cursor-not-allowed" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-slate-700 uppercase">Nombre del Artículo *</label>
                <input type="text" required value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none font-bold text-slate-900" />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase">Rubro (Categoría) *</label>
                <input type="text" required value={editingProduct.category || ''} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase">Sub-Categoría</label>
                <input type="text" value={editingProduct.subcategory || ''} onChange={e => setEditingProduct({...editingProduct, subcategory: e.target.value})} className="w-full mt-1 p-2 border rounded bg-slate-50 text-sm outline-none" />
              </div>

              <div className="md:col-span-2 mt-4"><h4 className="text-xs font-bold text-slate-400 uppercase">Configuración de Promoción</h4><hr className="mt-1 border-slate-100"/></div>

              <div className="flex items-center h-full pt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={editingProduct.is_promo || false} onChange={e => setEditingProduct({...editingProduct, is_promo: e.target.checked})} className="rounded border-slate-300 w-5 h-5 text-amber-500 focus:ring-amber-500" />
                  <span className="text-sm font-bold text-slate-700 uppercase">Activar Oferta</span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase">Precio Promocional ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  disabled={!editingProduct.is_promo} 
                  value={editingProduct.promo_price || ''} 
                  onChange={e => setEditingProduct({...editingProduct, promo_price: e.target.value})} 
                  className={`w-full mt-1 p-2 border rounded text-sm outline-none font-mono ${!editingProduct.is_promo ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 text-slate-900 border-amber-300'}`} 
                  placeholder="Ej: 1500.50"
                />
                <p className="text-[10px] text-slate-400 mt-1">Solo aplica si la oferta está activada.</p>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-2 mt-6 shrink-0 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow cursor-pointer">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};