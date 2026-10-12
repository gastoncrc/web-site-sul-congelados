import React, { useEffect, useState } from 'react';
import { Search, Tag, Save } from 'lucide-react';
import { api } from '../../config/api';
import { formatPrice } from '../../../utils/currency';

interface PriceListManagerProps {
  setSystemMessage: (msg: string) => void;
}

interface PriceListProduct {
  sku: string;
  name: string;
  category: string;
  base_price: number | null;
  markup_percent: number | null;
  precio: number;
}

export const PriceListManager: React.FC<PriceListManagerProps> = ({ setSystemMessage }) => {
  const [lists, setLists] = useState<{ convenio: string; total_productos: number }[]>([]);
  const [selectedConvenio, setSelectedConvenio] = useState('');
  const [products, setProducts] = useState<PriceListProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [markupInput, setMarkupInput] = useState('');

  const fetchLists = async () => {
    try {
      const response = await api.get('/products/price-lists');
      setLists(response.data);
      if (response.data.length > 0 && !selectedConvenio) {
        setSelectedConvenio(response.data[0].convenio);
      }
    } catch (err) {
      setSystemMessage('🚨 Error al cargar las listas de precios.');
    }
  };

  const fetchProductsForList = async (convenio: string) => {
    if (!convenio) return;
    setIsLoading(true);
    try {
      const response = await api.get(`/products/admin?convenio=${encodeURIComponent(convenio)}`);
      setProducts(response.data);
    } catch (err) {
      setSystemMessage('🚨 Error al cargar los precios de la lista.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLists(); }, []);
  useEffect(() => { fetchProductsForList(selectedConvenio); }, [selectedConvenio]);

  const startEdit = (p: PriceListProduct) => {
    setEditingSku(p.sku);
    setMarkupInput(p.markup_percent !== null ? String(p.markup_percent) : '0');
  };

  const saveMarkup = async (sku: string) => {
    const markup_percent = parseFloat(markupInput);
    if (isNaN(markup_percent)) return setSystemMessage('🚨 El markup tiene que ser un número.');
    try {
      const response = await api.put('/products/markup', { sku, convenio: selectedConvenio, markup_percent });
      setProducts(prev => prev.map(p => p.sku === sku ? { ...p, markup_percent, precio: response.data.precio } : p));
      setSystemMessage('✅ Markup actualizado.');
      setEditingSku(null);
    } catch (err: any) {
      setSystemMessage(`🚨 ${err.response?.data?.error || 'Error al actualizar el markup.'}`);
    }
  };

  const filteredProducts = products.filter(p =>
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-black text-ink uppercase flex items-center"><Tag className="mr-2 text-ink-soft" size={22}/> Listas de Precios</h1>
        <div className="flex items-center bg-paper border border-line rounded-xl px-4 py-2 w-full sm:w-96 shadow-sm">
          <Search size={18} className="text-ink-soft mr-2" />
          <input
            type="text"
            placeholder="Buscar por SKU o nombre..."
            className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-paper p-4 rounded-card shadow-sm border border-line flex flex-wrap gap-2">
        {lists.map(l => (
          <button
            key={l.convenio}
            onClick={() => setSelectedConvenio(l.convenio)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer border ${selectedConvenio === l.convenio ? 'bg-brand-primary text-brand-primary-on border-brand-primary' : 'bg-bg text-ink-soft border-line hover:bg-line/40'}`}
          >
            {l.convenio} <span className="opacity-60 font-normal">({l.total_productos})</span>
          </button>
        ))}
      </div>

      <div className="bg-paper rounded-card shadow-sm border border-line overflow-hidden relative">
        <div className="p-4 border-b border-line flex justify-between items-center bg-bg/50">
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">{selectedConvenio || 'Sin lista seleccionada'}</span>
          <span className="text-xs font-bold text-ink-soft">{filteredProducts.length} Artículos</span>
        </div>

        <div className="overflow-x-auto max-h-150 overflow-y-auto">
          <table className="min-w-200 w-full text-left text-sm border-collapse">
            <thead className="bg-bg text-ink-soft uppercase text-[10px] font-black tracking-widest border-b border-line sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Artículo</th>
                <th className="px-6 py-4 text-right">Precio Base</th>
                <th className="px-6 py-4 text-center">Markup %</th>
                <th className="px-6 py-4 text-right">Precio Final</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-ink-soft font-medium">Cargando...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-ink-soft font-medium">No hay productos en esta lista.</td></tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.sku} className="hover:bg-bg transition-colors">
                    <td className="px-6 py-4 font-mono-label font-bold text-ink-soft text-xs">{p.sku}</td>
                    <td className="px-6 py-4 font-bold text-ink">{p.name}</td>
                    <td className="px-6 py-4 text-right text-ink-soft font-mono">
                      {p.base_price !== null ? `$${formatPrice(p.base_price)}` : <span className="text-danger">Sin definir</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {editingSku === p.sku ? (
                        <input
                          type="number" step="0.01" autoFocus
                          value={markupInput}
                          onChange={e => setMarkupInput(e.target.value)}
                          className="w-20 p-1 border border-brand-gold/50 rounded bg-bg text-sm outline-none font-mono text-center"
                        />
                      ) : (
                        <span className="font-mono">{p.markup_percent !== null ? `${p.markup_percent}%` : '—'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-ink font-mono">${formatPrice(p.precio)}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {editingSku === p.sku ? (
                        <button onClick={() => saveMarkup(p.sku)} className="bg-brand-primary text-brand-primary-on px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-brand-accent transition cursor-pointer inline-flex items-center gap-1">
                          <Save size={12}/> Guardar
                        </button>
                      ) : (
                        <button
                          onClick={() => startEdit(p)}
                          disabled={p.base_price === null}
                          className="bg-line/60 text-ink-soft border border-line px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-brand-primary hover:text-brand-primary-on transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title={p.base_price === null ? 'Definí primero el precio base en Catálogo de Productos' : ''}
                        >
                          Editar Markup
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
    </div>
  );
};
