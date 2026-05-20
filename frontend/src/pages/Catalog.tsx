import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../types';
import { formatPrice } from '../../utils/currency';
import { ProductSlider } from '../components/ProductSlider'; // 🚀 IMPORTAMOS EL CARRUSEL

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
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="text-slate-400" size={20} /></div>
        <input type="text" placeholder="Buscar lomitos, hamburguesas, milanesas..." className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm focus:border-slate-950 focus:ring-4 focus:ring-slate-100 outline-none transition-all text-sm font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-black text-slate-400 hover:text-slate-600 transition cursor-pointer">LIMPIAR</button>}
      </div>

      <div className="w-full border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-2 text-slate-400 text-xs font-black uppercase tracking-wider mb-3"><Filter size={14}/> <span>Filtrar por Rubro</span></div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition border cursor-pointer ${selectedCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {currentProductsForDisplay.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border p-8"><p className="text-slate-400 font-bold text-base">No encontramos productos.</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentProductsForDisplay.map((product) => {
              const inCartQty = getQtyInCart(product.sku); 
              return (
                <div key={product.sku} className={`bg-white rounded-2xl border p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden ${inCartQty > 0 ? 'border-slate-400' : 'border-slate-200'}`}>
                  {product.isPromo && <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-black px-3 py-1 uppercase tracking-widest shadow-sm rounded-bl-xl">OFERTA</div>}
                  <div className={product.isPromo ? "pt-4" : ""}><span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{product.category}</span><h3 className="font-bold text-slate-900 text-sm leading-tight mb-1 mt-1">{product.name}</h3><p className="text-slate-400 text-[11px] font-mono mb-3">SKU: {product.sku}</p>{product.description && <p className="text-slate-500 text-xs line-clamp-2 mb-4">{product.description}</p>}</div>
                  <div className="mt-4">
                    <div className="mb-3">
                      {product.isPromo ? <div className="flex items-baseline space-x-2"><span className="text-lg font-black text-slate-900">${formatPrice(product.promoPrice ?? 0)}</span><span className="text-xs text-slate-400 line-through">${formatPrice(product.unitPrice ?? 0)}</span></div> : <span className="text-lg font-black text-slate-900">${formatPrice(product.unitPrice ?? 0)}</span>}
                    </div>
                    <button onClick={() => handleAddToCart(product)} className={`w-full font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer ${inCartQty > 0 ? 'bg-[#deff9a] text-slate-900 hover:bg-[#cceb88]' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                      <ShoppingCart size={14}/><span>{inCartQty > 0 ? `Añadir otro (${inCartQty})` : 'Añadir al Pedido'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-6 border-t border-slate-100">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} className="p-2 rounded-xl border bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"><ChevronLeft size={18} /></button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 text-xs font-black rounded-xl transition cursor-pointer ${currentPage === page ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border hover:bg-slate-50'}`}>{page}</button>
                ))}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} className="p-2 rounded-xl border bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"><ChevronRight size={18} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
};