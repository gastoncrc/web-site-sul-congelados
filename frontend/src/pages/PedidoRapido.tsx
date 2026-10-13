import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Star, AlertTriangle, ClipboardPaste, X } from 'lucide-react';
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
  const [lowStockThreshold, setLowStockThreshold] = useState<number | undefined>(undefined);

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteResult, setPasteResult] = useState<{ loaded: number; notFound: string[] } | null>(null);

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
    api.get('/settings').then(res => {
      if (res.data.low_stock_threshold) setLowStockThreshold(Number(res.data.low_stock_threshold));
    }).catch(() => {});
  }, []);

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

  // Pegado masivo — "SKU cantidad" por línea, para clientes que ya tienen su propia
  // lista armada (de un pedido anterior, su propio Excel, etc.) en vez de tipear uno por uno.
  const handlePasteSubmit = async () => {
    const lines = pasteText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed: { sku: string; qty: number }[] = [];
    for (const line of lines) {
      const tokens = line.split(/\s+/);
      if (tokens.length < 2) continue;
      const qty = parseInt(tokens[tokens.length - 1], 10);
      if (!qty || qty <= 0) continue;
      const sku = tokens.slice(0, -1).join(' ').trim();
      if (sku) parsed.push({ sku, qty });
    }
    if (parsed.length === 0) {
      setPasteResult({ loaded: 0, notFound: [] });
      return;
    }
    try {
      const skuList = [...new Set(parsed.map(p => p.sku))];
      const res = await api.get('/products', { params: { skus: skuList.join(',') } });
      const bySku: Record<string, RapidoProduct> = {};
      for (const p of res.data.products as RapidoProduct[]) bySku[p.sku] = p;

      const notFound: string[] = [];
      let loaded = 0;
      for (const { sku, qty } of parsed) {
        const product = bySku[sku];
        if (!product) { notFound.push(sku); continue; }
        setQty(product, qty);
        loaded++;
      }
      setPasteResult({ loaded, notFound });
      if (notFound.length === 0) {
        setPasteText('');
        setTimeout(() => { setShowPasteModal(false); setPasteResult(null); }, 1200);
      }
    } catch {
      setPasteResult({ loaded: 0, notFound: parsed.map(p => p.sku) });
    }
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
        <button
          onClick={() => { setShowPasteModal(true); setPasteResult(null); }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer border shrink-0 bg-paper text-ink-soft border-line hover:bg-bg"
        >
          <ClipboardPaste size={15} /> Pegar lista
        </button>
      </div>

      {onlyFavorites && favorites.length === 0 && (
        <div className="text-center py-10 bg-paper border border-line rounded-card text-ink-soft text-sm">
          Todavía no marcaste productos como habituales — tocá la estrella ⭐ junto a un producto para guardarlo acá.
        </div>
      )}

      {!(onlyFavorites && favorites.length === 0) && (
        <>
          {isLoading ? (
            <div className="text-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div></div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-ink-soft font-bold bg-paper border border-line rounded-card">No encontramos productos.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map(product => {
                const qty = quantities.current[product.sku] || 0;
                const price = product.isPromo ? (product.promoPrice ?? 0) : product.unitPrice;
                const mode = qtyMode.current[product.sku] || 'unidad';
                const isFavorite = favorites.includes(product.sku);
                const displayQty = mode === 'caja' && product.packageSize ? Math.round(qty / product.packageSize) : qty;
                const lastQtyForSku = lastQty[product.sku];
                const isLowStock = typeof product.stock === 'number' && product.stock > 0 && typeof lowStockThreshold === 'number' && product.stock < lowStockThreshold;
                return (
                  <div key={product.sku} className={`flex flex-col gap-2 p-3 rounded-card border ${qty > 0 ? 'bg-brand-gold/5 border-brand-gold/40' : 'bg-paper border-line'}`}>
                    <div className="flex items-start gap-2">
                      {user && (
                        <button type="button" onClick={() => toggleFavorite(product.sku)} className="shrink-0 mt-0.5 text-ink-soft hover:text-brand-gold-deep transition cursor-pointer" title="Marcar como habitual">
                          <Star size={15} className={isFavorite ? 'fill-brand-gold text-brand-gold-deep' : ''} />
                        </button>
                      )}
                      <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center shrink-0 text-brand-gold-deep">
                        <Package size={14} />
                      </div>
                      <p className="text-sm font-bold text-ink leading-tight flex-1 min-w-0">{product.name}</p>
                      {product.category && (
                        <span className="shrink-0 text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded bg-line/60 text-ink-soft whitespace-nowrap">{product.category}</span>
                      )}
                    </div>

                    <p className="text-[10px] font-mono-label text-ink-soft pl-[1px]">
                      SKU: {product.sku}
                      {product.packageSize ? ` · Caja x${product.packageSize}` : ''}
                      {lastQtyForSku ? ` · Última vez: ${lastQtyForSku}` : ''}
                    </p>

                    {isLowStock && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded bg-warning/15 text-warning w-fit">
                        <AlertTriangle size={10} /> Últimas unidades
                      </span>
                    )}

                    <div className="flex items-center gap-2 mt-auto pt-1">
                      <span className="text-sm font-black text-ink flex-1">${formatPrice(price)}</span>
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
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-lg border border-line bg-paper disabled:opacity-40 text-sm">Anterior</button>
          <span className="text-xs text-ink-soft">Página {page} de {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1.5 rounded-lg border border-line bg-paper disabled:opacity-40 text-sm">Siguiente</button>
        </div>
      )}

      {totalItems > 0 && (
        <div className="sticky bottom-4 bg-brand-primary text-white rounded-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-lg">
          <span className="text-sm font-bold text-center sm:text-left">{totalItems} producto{totalItems > 1 ? 's' : ''} · Total: ${formatPrice(totalAmount)}</span>
          <button onClick={handleConfirmar} className="bg-brand-gold text-brand-gold-on font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-brand-gold-deep transition cursor-pointer shrink-0">Agregar al Pedido</button>
        </div>
      )}

      {showPasteModal && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPasteModal(false)}>
          <div className="bg-paper w-full max-w-md rounded-card shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 bg-brand-primary text-white flex justify-between items-center">
              <h3 className="font-black uppercase text-sm tracking-wider flex items-center">
                <ClipboardPaste size={16} className="mr-2 text-brand-gold" /> Pegar lista de productos
              </h3>
              <button onClick={() => setShowPasteModal(false)} className="text-white/60 hover:text-white font-black cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-ink-soft">Un producto por línea: <strong>código SKU</strong> y <strong>cantidad</strong>, separados por un espacio. Ej:</p>
              <pre className="bg-bg border border-line rounded-lg p-3 text-[11px] font-mono-label text-ink-soft">0108 30{'\n'}1182 5</pre>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                rows={6}
                placeholder="0108 30&#10;1182 5"
                className="w-full p-3 border border-line rounded-xl bg-bg text-sm font-mono-label outline-none focus:border-brand-gold"
              />
              {pasteResult && (
                <div className={`text-xs rounded-lg p-3 ${pasteResult.notFound.length > 0 ? 'bg-warning/10 text-warning border border-warning/30' : 'bg-success/10 text-success border border-success/30'}`}>
                  {pasteResult.loaded > 0 && <p className="font-bold">✅ {pasteResult.loaded} producto{pasteResult.loaded > 1 ? 's' : ''} cargado{pasteResult.loaded > 1 ? 's' : ''}.</p>}
                  {pasteResult.notFound.length > 0 && <p className="mt-1">No encontramos estos SKUs en tu lista de precios: {pasteResult.notFound.join(', ')}.</p>}
                  {pasteResult.loaded === 0 && pasteResult.notFound.length === 0 && <p>No pudimos leer ninguna línea — revisá el formato.</p>}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowPasteModal(false)} className="px-4 py-2 rounded-xl border border-line text-ink-soft font-bold text-xs hover:bg-bg transition cursor-pointer">Cerrar</button>
                <button onClick={handlePasteSubmit} className="px-4 py-2 rounded-xl bg-brand-primary text-brand-primary-on font-bold text-xs hover:bg-brand-accent transition cursor-pointer">Cargar lista</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
