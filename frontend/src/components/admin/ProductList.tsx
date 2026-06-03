import React, { useState } from 'react';
import { Search, Edit3, History, Calendar, User, ArrowRight } from 'lucide-react';
import { api } from '../../config/api';
import { formatPrice } from '../../../utils/currency';

interface ProductListProps {
  products: any[];
  onRefresh: () => Promise<void>;
  setSystemMessage: (msg: string) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, onRefresh, setSystemMessage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isShowingInactive, setIsShowingInactive] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [historyProduct, setHistoryProduct] = useState<any | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchPriceHistory = async (p: any) => {
    setHistoryProduct(p);
    setIsLoadingHistory(true);
    try {
      const response = await api.get(`/products/${p.sku}/price-history`);
      setPriceHistory(response.data);
    } catch (err) {
      console.error('Error cargando historial:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = isShowingInactive ? true : p.is_active;
    return matchesSearch && matchesStatus;
  });

  const handleToggleProductStatus = async (sku: string, currentStatus: boolean) => {
    try {
      await api.patch(`/products/${sku}/flags`, { is_active: !currentStatus });
      setSystemMessage(!currentStatus ? '✅ Producto Reactivado' : '✅ Producto Pausado');
      await onRefresh();
    } catch (err) {
      setSystemMessage('🚨 Error al cambiar el estado del producto.');
    }
  };

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
        promo_price: parseFloat(editingProduct.promo_price) || 0,
        in_slider: editingProduct.in_slider 
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

        <div className="overflow-x-auto max-h-150 overflow-y-auto">
          <table className="min-w-200 w-full text-left text-sm border-collapse">
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
                      <div className="flex space-x-1 mt-1">
                        {p.is_promo && <span className="text-[9px] bg-amber-100 text-amber-700 font-black px-1.5 py-0.5 rounded uppercase">Oferta</span>}
                        {p.in_slider && <span className="text-[9px] bg-blue-100 text-blue-700 font-black px-1.5 py-0.5 rounded uppercase">Destacado</span>}
                      </div>
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
                        onClick={() => fetchPriceHistory(p)}
                        className="p-2 text-slate-400 hover:text-slate-900 transition cursor-pointer"
                        title="Historial de Precios"
                      >
                        <History size={16} />
                      </button>
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

              <div className="md:col-span-2 mt-4"><h4 className="text-xs font-bold text-slate-400 uppercase">Configuración Comercial y Destacados</h4><hr className="mt-1 border-slate-100"/></div>

              <div className="flex flex-col justify-center space-y-4 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={editingProduct.is_promo || false} onChange={e => setEditingProduct({...editingProduct, is_promo: e.target.checked})} className="rounded border-slate-300 w-5 h-5 text-amber-500 focus:ring-amber-500" />
                  <span className="text-sm font-bold text-slate-700 uppercase">1. Activar Oferta (Precio Tachado)</span>
                </label>

                <label className={`flex items-center space-x-2 ${(!editingProduct.in_slider && products.filter(p => p.in_slider).length >= 6) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input 
                    type="checkbox" 
                    disabled={!editingProduct.in_slider && products.filter(p => p.in_slider).length >= 6}
                    checked={editingProduct.in_slider || false} 
                    onChange={e => setEditingProduct({...editingProduct, in_slider: e.target.checked})} 
                    className="rounded border-slate-300 w-5 h-5 text-blue-600 focus:ring-blue-600" 
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700 uppercase">2. Destacar en Carrusel Principal</span>
                    {(!editingProduct.in_slider && products.filter(p => p.in_slider).length >= 6) && (
                      <span className="text-[10px] text-red-500 font-bold">Límite alcanzado (Máx 6). Quitá uno primero.</span>
                    )}
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase">Precio Promocional ($)</label>
                <input 
                  type="number" step="0.01"
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

      {/* 🚀 MODAL DE HISTORIAL DE PRECIOS */}
      {historyProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#020617] w-full max-w-lg rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center">
                  <History size={18} className="mr-2 text-[#deff9a]" /> Auditoría de Precios
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">{historyProduct.name}</p>
              </div>
              <button onClick={() => setHistoryProduct(null)} className="text-slate-500 hover:text-white transition cursor-pointer">✕</button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {isLoadingHistory ? (
                <div className="text-center py-10 text-slate-500 font-bold animate-pulse text-xs">CONSULTANDO LOGS DE SISTEMA...</div>
              ) : priceHistory.length === 0 ? (
                <div className="text-center py-10 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                  <Calendar size={32} className="mx-auto mb-2 text-slate-700" />
                  <p className="text-slate-500 text-xs font-bold uppercase">No hay cambios registrados todavía.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {priceHistory.map((entry, idx) => (
                    <div key={idx} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="bg-[#deff9a]/10 p-2 rounded-xl text-[#deff9a]"><User size={12}/></div>
                          <span className="text-[10px] text-slate-300 font-black uppercase">{entry.changed_by?.split('@')[0] || 'Sistema'}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono">{new Date(entry.changed_at).toLocaleString('es-AR')}</span>
                      </div>
                      
                      <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                        <div className="text-center flex-1">
                          <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Anterior</p>
                          <p className="text-xs text-slate-400 font-bold line-through">${formatPrice(parseFloat(entry.old_price || 0))}</p>
                        </div>
                        <ArrowRight size={14} className="text-slate-700 mx-2" />
                        <div className="text-center flex-1">
                          <p className="text-[8px] text-[#deff9a] uppercase font-black mb-1">Nuevo</p>
                          <p className="text-sm text-white font-black tracking-tight">${formatPrice(parseFloat(entry.new_price))}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex justify-end">
                        <span className="text-[8px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-black uppercase tracking-widest">{entry.convenio}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-900/30 border-t border-slate-800">
              <button onClick={() => setHistoryProduct(null)} className="w-full bg-white text-black font-black py-3 rounded-2xl text-xs uppercase hover:bg-slate-200 transition cursor-pointer">Cerrar Auditoría</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
