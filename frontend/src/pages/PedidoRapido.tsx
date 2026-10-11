import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Star } from 'lucide-react';
import type { Product } from '../types';
import { api } from '../config/api';
import { formatPrice } from '../../utils/currency';
import { useAuth } from '../context/AuthContext';

interface RapidoProduct extends Product {
  isPromo?: boolean;
  promoPrice?: number;
  unitPrice: number;
  packageSize?: number;
}

interface PedidoRapidoProps {
  cart: any[];
  setShoppingCart: React.Dispatch<React.SetStateAction<any[]>>;
}

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 400;

export const PedidoRapido: React.FC<PedidoRapidoProps> = ({ setShoppingCart }) => {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('TODOS');
  const [page, setPage] = useState(1);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lastQty, setLastQty] = useState<Record<string, number>>({});

  const [products, setProducts] = useState<RapidoProduct[]>([]);
  const [categories, setCategories] = useState<string[]>(['TODOS']);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const quantities = useRef<Record<string, number>>({});
  const selectedProducts = useRef<Record<string, RapidoProduct>>({});
  const qtyMode = useRef<Record<string, 'unidad' | 'caja'>>({});
  const [, forceRender] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => setPage(1), [searchTerm, category]);

  useEffect(() => {
    if (!user) return;
    api.get('/products/favorites').then(res => setFavorites(res.data)).catch(() => setFavorites([]));
    api.get('/orders/last-quantities').then(res => setLastQty(res.data)).catch(() => setLastQty({}));
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const run = async () => {
      try {
        let res;
        if (onlyFavorites) {
          if (favorites.length === 0) {
            if (!cancelled) { setProducts([]); setTotalPages(1); }
            return;
          }
          res = await api.get('/products', { params: { skus: favorites.join(',') } });
        } else {
          const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
          if (searchTerm) params.search = searchTerm;
          if (category !== 'TODOS') params.category = category;
          res = await api.get('/products', { params });
        }
        if (cancelled) return;
        setProducts(res.data.products);
        setTotalPages(res.data.totalPages);
        if (!onlyFavorites) setCategories(['TODOS', ...res.data.categories]);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [page, searchTerm, category, onlyFavorites, favorites]);

  const setQty = (product: RapidoProduct, qty: number) => {
    quantities.current[product.sku] = qty;
    selectedProducts.current[product.sku] = product;
    forceRender(n => n + 1);
  };

  const toggleFavorite = async (sku: string) => {
    setFavorites(prev => prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku]);
    try { await api.post(`/products/favorites/${sku}`); } catch { /* UI ya se actualizó; se resincroniza en el próximo fetch */ }
  };

  const entries = Object.entries(quantities.current).filter(([, qty]) => qty > 0);
  const totalItems = entries.length;
  const totalAmount = entries.reduce((sum, [sku, qty]) => {
    const p = selectedProducts.current[sku];
    if (!p) return sum;
    const price = p.isPromo ? (p.promoPrice ?? 0) : p.unitPrice;
    return sum + price * qty;
  }, 0);

  const [confirmMessage, setConfirmMessage] = useState('');

  const handleConfirmar = () => {
    if (totalItems === 0) return;
    setShoppingCart((prevCart: any[]) => {
      const newCart = [...prevCart];
      for (const [sku, qty] of entries) {
        const product = selectedProducts.current[sku];
        if (!product) continue;
        const idx = newCart.findIndex(item => item.product.sku === sku);
        if (idx >= 0) newCart[idx] = { ...newCart[idx], quantity: newCart[idx].quantity + qty };
        else newCart.push({ product, quantity: qty });
      }
      return newCart;
    });
    setConfirmMessage(`✅ ${totalItems} producto${totalItems > 1 ? 's' : ''} agregado${totalItems > 1 ? 's' : ''} al pedido.`);
    quantities.current = {};
    selectedProducts.current = {};
    forceRender(n => n + 1);
    setTimeout(() => setConfirmMessage(''), 4000);
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-black text-ink font-heading">Pedido Rápido</h1>
        <p className="text-sm text-ink-soft mt-1">Cargá cantidades directamente — ideal si ya sabés qué productos necesitás.</p>
      </div>

      {confirmMessage && (
        <div className="bg-success/10 border border-success/30 text-success text-sm font-bold rounded-xl p-3">{confirmMessage}</div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="text-ink-soft" size={18} /></div>
          <input type="text" placeholder="Buscar por nombre o SKU..." disabled={onlyFavorites} className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-line bg-paper text-sm outline-none focus:border-brand-gold disabled:opacity-50" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={onlyFavorites} className="px-4 py-2.5 rounded-xl border border-line bg-paper text-sm outline-none focus:border-brand-gold disabled:opacity-50">
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        {user && (
          <button
            onClick={() => setOnlyFavorites(v => !v)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer border shrink-0 ${onlyFavorites ? 'bg-brand-gold text-brand-gold-on border-brand-gold' : 'bg-paper text-ink-soft border-line hover:bg-bg'}`}
          >
            <Star size={15} className={onlyFavorites ? 'fill-current' : ''} /> Habituales
          </button>
        )}
      </div>

      {onlyFavorites && favorites.length === 0 && (
        <div className="text-center py-10 bg-paper border border-line rounded-card text-ink-soft text-sm">
          Todavía no marcaste productos como habituales — tocá la estrella ⭐ junto a un producto para guardarlo acá.
        </div>
      )}

      {!(onlyFavorites && favorites.length === 0) && (
        <div className="bg-paper border border-line rounded-card overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div></div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-ink-soft font-bold">No encontramos productos.</div>
          ) : (
            <div className="divide-y divide-line">
              {products.map(product => {
                const qty = quantities.current[product.sku] || 0;
                const price = product.isPromo ? (product.promoPrice ?? 0) : product.unitPrice;
                const mode = qtyMode.current[product.sku] || 'unidad';
                const isFavorite = favorites.includes(product.sku);
                const displayQty = mode === 'caja' && product.packageSize ? Math.round(qty / product.packageSize) : qty;
                const lastQtyForSku = lastQty[product.sku];
                return (
                  <div key={product.sku} className={`flex items-center gap-3 p-3 ${qty > 0 ? 'bg-brand-gold/5' : ''}`}>
                    {user && (
                      <button type="button" onClick={() => toggleFavorite(product.sku)} className="shrink-0 text-ink-soft hover:text-brand-gold-deep transition cursor-pointer" title="Marcar como habitual">
                        <Star size={16} className={isFavorite ? 'fill-brand-gold text-brand-gold-deep' : ''} />
                      </button>
                    )}
                    <div className="w-9 h-9 rounded-lg bg-brand-gold/10 flex items-center justify-center shrink-0 text-brand-gold-deep">
                      <Package size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-ink truncate">{product.name}</p>
                      <p className="text-[10px] font-mono-label text-ink-soft">
                        SKU: {product.sku}
                        {product.packageSize ? ` · Caja x${product.packageSize}` : ''}
                        {lastQtyForSku ? ` · Última vez: ${lastQtyForSku}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-black text-ink w-24 text-right shrink-0">${formatPrice(price)}</span>
                    {!!product.packageSize && (
                      <div className="flex rounded-lg border border-line overflow-hidden shrink-0 text-[10px] font-bold uppercase">
                        <button type="button" onClick={() => { qtyMode.current[product.sku] = 'unidad'; forceRender(n => n + 1); }} className={`px-2 py-1.5 cursor-pointer ${mode === 'unidad' ? 'bg-brand-primary text-brand-primary-on' : 'bg-paper text-ink-soft'}`}>Un.</button>
                        <button type="button" onClick={() => { qtyMode.current[product.sku] = 'caja'; forceRender(n => n + 1); }} className={`px-2 py-1.5 cursor-pointer ${mode === 'caja' ? 'bg-brand-primary text-brand-primary-on' : 'bg-paper text-ink-soft'}`}>Caja</button>
                      </div>
                    )}
                    <input
                      type="number"
                      min={0}
                      value={displayQty || ''}
                      placeholder="0"
                      onChange={(e) => {
                        const raw = Math.max(0, parseInt(e.target.value) || 0);
                        const newTotal = mode === 'caja' ? raw * (product.packageSize || 1) : raw;
                        setQty(product, newTotal);
                      }}
                      className="w-16 text-center border border-line rounded-lg py-1.5 text-sm font-bold outline-none focus:border-brand-gold shrink-0"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-lg border border-line bg-paper disabled:opacity-40 text-sm">Anterior</button>
          <span className="text-xs text-ink-soft">Página {page} de {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1.5 rounded-lg border border-line bg-paper disabled:opacity-40 text-sm">Siguiente</button>
        </div>
      )}

      {totalItems > 0 && (
        <div className="sticky bottom-4 bg-brand-primary text-white rounded-card p-4 flex items-center justify-between shadow-lg">
          <span className="text-sm font-bold">{totalItems} producto{totalItems > 1 ? 's' : ''} · Total: ${formatPrice(totalAmount)}</span>
          <button onClick={handleConfirmar} className="bg-brand-gold text-brand-gold-on font-bold px-5 py-2 rounded-xl text-sm hover:bg-brand-gold-deep transition cursor-pointer">Agregar al Pedido</button>
        </div>
      )}
    </div>
  );
};
