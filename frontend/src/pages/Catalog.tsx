import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Factory, Snowflake, Utensils } from 'lucide-react';
import type { Product } from '../types';
import { api } from '../config/api';
import { ProductSlider } from '../components/ProductSlider'; // 🚀 IMPORTAMOS EL CARRUSEL
import { ProductCard } from '../components/ProductCard';

const PILARES = [
  { Icon: Factory, title: 'Industria seria', desc: 'Proveedor B2B, no consumo masivo' },
  { Icon: Snowflake, title: 'Cadena de frío', desc: 'Trazabilidad en cada entrega' },
  { Icon: Utensils, title: 'Apetito real', desc: 'Comida servida en restaurantes' },
];

interface CatalogProduct extends Product {
  isPromo?: boolean;
  promoPrice?: number;
  unitPrice: number;
  inSlider?: boolean;
}

interface CatalogProps {
  cart: any[];
  setShoppingCart: React.Dispatch<React.SetStateAction<any[]>>;
}

const ITEMS_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 400;

export const Catalog: React.FC<CatalogProps> = ({ cart, setShoppingCart }) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<string[]>(['TODOS']);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [sliderProducts, setSliderProducts] = useState<CatalogProduct[]>([]);

  // Debounce: espera a que el usuario deje de tipear antes de pegarle al servidor
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => setCurrentPage(1), [searchTerm, selectedCategory]);

  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number> = { page: currentPage, limit: ITEMS_PER_PAGE };
        if (searchTerm) params.search = searchTerm;
        if (selectedCategory !== 'TODOS') params.category = selectedCategory;
        const response = await api.get('/products', { params });
        if (cancelled) return;
        setProducts(response.data.products);
        setTotalPages(response.data.totalPages);
        setCategories(['TODOS', ...response.data.categories]);
      } catch (error) {
        if (!cancelled) { setProducts([]); setTotalPages(1); }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchProducts();
    return () => { cancelled = true; };
  }, [currentPage, searchTerm, selectedCategory]);

  useEffect(() => {
    api.get('/products/slider').then(res => setSliderProducts(res.data)).catch(() => setSliderProducts([]));
  }, []);

  const handleAddToCart = (product: CatalogProduct) => {
    setShoppingCart((prevCart) => {
      const existing = prevCart.find(item => item.product.sku === product.sku);
      if (existing) return prevCart.map(item => item.product.sku === product.sku ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const getQtyInCart = (sku: string) => cart.find(item => item.product.sku === sku)?.quantity || 0;

  const isHomeView = searchTerm === '' && selectedCategory === 'TODOS';
  const showingSlider = isHomeView && sliderProducts.length > 0;

  return (
    <div className="w-full space-y-8 overflow-hidden">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-select { user-select: none; -webkit-user-select: none; }
      `}</style>

      {/* Franja institucional — solo en la vista "home" del catálogo, antes de filtrar/buscar */}
      {isHomeView && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PILARES.map(({ Icon, title, desc }) => (
            <div key={title} className="bg-paper border border-line rounded-card p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-gold/10 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-brand-gold-deep" />
              </div>
              <div>
                <p className="text-xs font-black text-ink uppercase tracking-wide">{title}</p>
                <p className="text-[11px] text-ink-soft leading-tight">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🚀 COMPONENTE DEL CARRUSEL MODULARIZADO */}
      {showingSlider && (
        <ProductSlider sliderProducts={sliderProducts} getQtyInCart={getQtyInCart} handleAddToCart={handleAddToCart} />
      )}

      <div className="relative max-w-2xl mx-auto w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="text-ink-soft" size={20} /></div>
        <input type="text" placeholder="Buscar lomitos, hamburguesas, milanesas..." className="w-full pl-12 pr-4 py-3.5 rounded-card border border-line bg-paper shadow-sm focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/10 outline-none transition-all text-sm font-medium" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        {searchInput && <button onClick={() => setSearchInput('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-black text-ink-soft hover:text-ink transition cursor-pointer">LIMPIAR</button>}
      </div>

      <div className="w-full border-b border-line pb-4">
        <div className="flex items-center space-x-2 text-ink-soft text-xs font-black uppercase tracking-wider mb-3"><Filter size={14}/> <span>Filtrar por Rubro</span></div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition border cursor-pointer ${selectedCategory === cat ? 'bg-brand-primary text-brand-primary-on border-brand-primary shadow-sm' : 'bg-paper text-ink-soft border-line hover:bg-bg'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div></div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-paper rounded-card border border-line p-8"><p className="text-ink-soft font-bold text-base">No encontramos productos.</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.sku} product={product} inCartQty={getQtyInCart(product.sku)} onAdd={handleAddToCart} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-6 border-t border-line">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} className="p-2 rounded-xl border border-line bg-paper hover:bg-bg disabled:opacity-40 cursor-pointer"><ChevronLeft size={18} /></button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 text-xs font-black rounded-xl transition cursor-pointer ${currentPage === page ? 'bg-brand-primary text-brand-primary-on' : 'bg-paper text-ink-soft border border-line hover:bg-bg'}`}>{page}</button>
                ))}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} className="p-2 rounded-xl border border-line bg-paper hover:bg-bg disabled:opacity-40 cursor-pointer"><ChevronRight size={18} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
