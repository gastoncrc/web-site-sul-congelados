import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../types';
import { ProductSlider } from '../components/ProductSlider'; // 🚀 IMPORTAMOS EL CARRUSEL
import { ProductCard } from '../components/ProductCard';

interface CatalogProduct extends Product {
  isPromo?: boolean;
  promoPrice?: number;
  unitPrice: number;
  inSlider?: boolean; 
}

interface CatalogProps {
  products: CatalogProduct[];
  cart: any[]; 
  setShoppingCart: React.Dispatch<React.SetStateAction<any[]>>;
}

export const Catalog: React.FC<CatalogProps> = ({ products, cart, setShoppingCart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12; 

  const categories = ['TODOS', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'TODOS' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => setCurrentPage(1), [searchTerm, selectedCategory]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const currentProductsForDisplay = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleAddToCart = (product: CatalogProduct) => {
    setShoppingCart((prevCart) => {
      const existing = prevCart.find(item => item.product.sku === product.sku);
      if (existing) return prevCart.map(item => item.product.sku === product.sku ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const getQtyInCart = (sku: string) => cart.find(item => item.product.sku === sku)?.quantity || 0;

  return (
    <div className="w-full space-y-8 overflow-hidden">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-select { user-select: none; -webkit-user-select: none; }
      `}</style>

      {/* 🚀 COMPONENTE DEL CARRUSEL MODULARIZADO */}
      {searchTerm === '' && selectedCategory === 'TODOS' && (
        <ProductSlider sliderProducts={products.filter(p => p.inSlider)} getQtyInCart={getQtyInCart} handleAddToCart={handleAddToCart} />
      )}

      <div className="relative max-w-2xl mx-auto w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="text-ink-soft" size={20} /></div>
        <input type="text" placeholder="Buscar lomitos, hamburguesas, milanesas..." className="w-full pl-12 pr-4 py-3.5 rounded-card border border-line bg-paper shadow-sm focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/10 outline-none transition-all text-sm font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-black text-ink-soft hover:text-ink transition cursor-pointer">LIMPIAR</button>}
      </div>

      <div className="w-full border-b border-line pb-4">
        <div className="flex items-center space-x-2 text-ink-soft text-xs font-black uppercase tracking-wider mb-3"><Filter size={14}/> <span>Filtrar por Rubro</span></div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition border cursor-pointer ${selectedCategory === cat ? 'bg-brand-primary text-brand-primary-on border-brand-primary shadow-sm' : 'bg-paper text-ink-soft border-line hover:bg-bg'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {currentProductsForDisplay.length === 0 ? (
        <div className="text-center py-16 bg-paper rounded-card border border-line p-8"><p className="text-ink-soft font-bold text-base">No encontramos productos.</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentProductsForDisplay.map((product) => (
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