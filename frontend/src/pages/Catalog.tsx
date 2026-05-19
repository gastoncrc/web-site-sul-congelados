import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import type { Product, CartItem } from '../types';

interface CatalogProduct extends Product {
  isPromo?: boolean;
  promoPrice?: number;
  unitPrice: number;
  inSlider?: boolean; 
}

interface CatalogProps {
  products: CatalogProduct[];
  cart: CartItem[]; 
  setShoppingCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export const Catalog: React.FC<CatalogProps> = ({ products, setShoppingCart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12; 

  // 🚀 Separar los productos del Carrusel
  const sliderProducts = products.filter(p => p.inSlider);

  const categories = ['TODOS', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase());
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

  return (
    <div className="w-full space-y-8 overflow-hidden">
      
      {/* 🚀 CSS PARA EL CARRUSEL */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-250px * ${sliderProducts.length} - 1rem * ${sliderProducts.length})); }
        }
        .slider-track {
          display: flex;
          width: max-content;
          animation: scroll ${sliderProducts.length * 4}s linear infinite;
        }
        .slider-track:hover { animation-play-state: paused; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 🌟 CARRUSEL DE DESTACADOS */}
      {sliderProducts.length > 0 && searchTerm === '' && selectedCategory === 'TODOS' && (
        <div className="w-full mb-10 border-b border-slate-200 pb-10">
          <div className="flex items-center space-x-2 text-slate-800 text-lg font-black uppercase tracking-wider mb-6">
            <Star className="text-amber-500 fill-amber-500" size={20}/> <span>Productos Destacados</span>
          </div>
          
          <div className="w-full overflow-hidden relative hide-scrollbar">
            {/* 🚀 CORRECCIÓN: bg-linear-to-* */}
            <div className="absolute top-0 bottom-0 left-0 w-16 bg-linear-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute top-0 bottom-0 right-0 w-16 bg-linear-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>
            
            <div className="slider-track gap-4">
              {[...sliderProducts, ...sliderProducts].map((product, idx) => (
                // 🚀 CORRECCIÓN: w-62.5 en lugar de w-[250px]
                <div key={`${product.sku}-${idx}`} className="w-62.5 shrink-0 bg-slate-900 rounded-2xl p-5 shadow-lg border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">{product.category}</span>
                    <h3 className="font-black text-white text-base leading-tight mt-1 mb-2 line-clamp-2">{product.name}</h3>
                  </div>
                  <div className="mt-4">
                    <div className="mb-3 flex items-baseline space-x-2">
                      <span className="text-xl font-black text-[#deff9a]">
                        ${product.isPromo ? product.promoPrice : product.unitPrice}
                      </span>
                      {product.isPromo && <span className="text-xs text-slate-500 line-through">${product.unitPrice}</span>}
                    </div>
                    <button onClick={() => handleAddToCart(product)} className="w-full bg-white hover:bg-slate-200 text-slate-900 font-bold py-2 rounded-xl text-xs transition cursor-pointer">
                      Añadir al Pedido
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🔍 BARRA DE BÚSQUEDA UNIVERSAL */}
      <div className="relative max-w-2xl mx-auto w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-slate-400" size={20} />
        </div>
        <input
          type="text"
          placeholder="Buscar lomitos, hamburguesas, milanesas o código SKU..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm focus:border-slate-950 focus:ring-4 focus:ring-slate-100 outline-none transition-all text-sm font-medium text-slate-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-black text-slate-400 hover:text-slate-600 transition cursor-pointer">
            LIMPIAR
          </button>
        )}
      </div>

      {/* 🏷️ FILTROS DINÁMICOS POR RUBRO */}
      <div className="w-full border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-2 text-slate-400 text-xs font-black uppercase tracking-wider mb-3">
          <Filter size={14}/> <span>Filtrar por Rubro</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition border cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 📦 GRILLA DE RESULTADOS PAGINADOS */}
      {currentProductsForDisplay.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 p-8">
          <p className="text-slate-400 font-bold text-base">No encontramos productos que coincidan con los filtros seleccionados.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentProductsForDisplay.map((product) => (
              <div key={product.sku} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition relative overflow-hidden">
                
                {product.isPromo && <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-black px-3 py-1 uppercase tracking-widest shadow-sm rounded-bl-xl">OFERTA</div>}
                
                <div className={product.isPromo ? "pt-4" : ""}>
                  <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{product.category}</span>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1 mt-1">{product.name}</h3>
                  <p className="text-slate-400 text-[11px] font-mono mb-3">SKU: {product.sku}</p>
                  {product.description && <p className="text-slate-500 text-xs line-clamp-2 mb-4">{product.description}</p>}
                </div>

                <div className="mt-4">
                  <div className="mb-3">
                    {product.isPromo ? (
                      <div className="flex items-baseline space-x-2">
                        <span className="text-lg font-black text-slate-900">${product.promoPrice}</span>
                        <span className="text-xs text-slate-400 line-through">${product.unitPrice}</span>
                      </div>
                    ) : (
                      <span className="text-lg font-black text-slate-900">${product.unitPrice}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <ShoppingCart size={14}/>
                    <span>Añadir al Pedido</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 🔢 CONTROLES DE PAGINACIÓN */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-6 border-t border-slate-100">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 text-xs font-black rounded-xl transition cursor-pointer ${
                      currentPage === page
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
};