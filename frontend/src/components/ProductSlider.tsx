import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Zap, Sparkles, Tag, Layers } from 'lucide-react';
import { ProductCard } from './ProductCard';

interface ProductSliderProps {
  sliderProducts: any[];
  getQtyInCart: (sku: string) => number;
  handleAddToCart: (product: any) => void;
  favorites?: string[];
  onToggleFavorite?: (sku: string) => void;
  lastQtyBySku?: Record<string, number>;
  lowStockThreshold?: number;
}

type Segmento = 'TODOS' | 'OFERTAS' | 'COMBOS' | 'NUEVOS';

export const ProductSlider: React.FC<ProductSliderProps> = ({ sliderProducts, getQtyInCart, handleAddToCart, favorites, onToggleFavorite, lastQtyBySku, lowStockThreshold }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const [segmento, setSegmento] = useState<Segmento>('TODOS');

  // Pestañas de merchandising — solo se muestran las que realmente tienen
  // productos, para no ofrecer un filtro que vacía el carrusel.
  const segmentos = useMemo(() => {
    const tabs: { key: Segmento; label: string; Icon: any; match: (p: any) => boolean }[] = [
      { key: 'OFERTAS', label: 'Ofertas', Icon: Tag, match: (p) => !!p.isPromo },
      { key: 'COMBOS', label: 'Combos', Icon: Layers, match: (p) => p.category?.toLowerCase() === 'combos' },
      { key: 'NUEVOS', label: 'Nuevos', Icon: Sparkles, match: (p) => !!p.isNew },
    ];
    return tabs.filter(t => sliderProducts.some(t.match));
  }, [sliderProducts]);

  const filteredProducts = useMemo(() => {
    if (segmento === 'TODOS') return sliderProducts;
    const tab = segmentos.find(t => t.key === segmento);
    return tab ? sliderProducts.filter(tab.match) : sliderProducts;
  }, [sliderProducts, segmento, segmentos]);

  const minItemsRequired = 8;
  const repeatCount = filteredProducts.length > 0 ? Math.ceil(minItemsRequired / filteredProducts.length) : 1;
  const baseSliders = Array(repeatCount).fill(filteredProducts).flat();
  const displaySliders = [...baseSliders, ...baseSliders];

  useEffect(() => {
    let animationId: number;
    const slider = sliderRef.current;
    let frameCount = 0; 
    const step = () => {
      if (slider && !isSliderPaused && !isDragging.current) {
        frameCount++;
        if (frameCount % 2 === 0) { 
          slider.scrollLeft += 1; 
          if (slider.scrollLeft >= slider.scrollWidth / 2) slider.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(step);
    };
    if (filteredProducts.length > 0) animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, [isSliderPaused, filteredProducts.length]);

  // Al cambiar de pestaña, arrancar desde el principio del carrusel filtrado.
  useEffect(() => {
    if (sliderRef.current) sliderRef.current.scrollLeft = 0;
  }, [segmento]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsSliderPaused(true); isDragging.current = true;
    if (!sliderRef.current) return;
    startX.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeft.current = sliderRef.current.scrollLeft;
  };
  const handleMouseUpOrLeave = () => { setIsSliderPaused(false); isDragging.current = false; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    e.preventDefault(); 
    sliderRef.current.scrollLeft = scrollLeft.current - ((e.pageX - sliderRef.current.offsetLeft) - startX.current) * 1.5;
  };

  if (sliderProducts.length === 0) return null;

  return (
    <div className="w-full mb-10 bg-brand-primary rounded-3xl p-6 md:p-8 shadow-xl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center space-x-2 text-white text-lg font-black uppercase tracking-wider">
          <Zap className="text-brand-gold fill-brand-gold" size={22}/>
          <span>Destacados de la Semana</span>
        </div>
        {segmentos.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setSegmento('TODOS')} className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition cursor-pointer ${segmento === 'TODOS' ? 'bg-brand-gold text-brand-gold-on' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>Todos</button>
            {segmentos.map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setSegmento(key)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition cursor-pointer ${segmento === key ? 'bg-brand-gold text-brand-gold-on' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                <Icon size={11} /> {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="w-full overflow-hidden relative rounded-xl">
        <div className="absolute top-0 bottom-0 left-0 w-12 bg-linear-to-r from-brand-primary to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 bottom-0 right-0 w-12 bg-linear-to-l from-brand-primary to-transparent z-10 pointer-events-none"></div>
        <div
          ref={sliderRef}
          className="flex gap-4 overflow-x-auto hide-scrollbar touch-pan-x py-2 cursor-grab active:cursor-grabbing no-select"
          onMouseEnter={() => setIsSliderPaused(true)} onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={() => setIsSliderPaused(true)} onTouchEnd={() => setIsSliderPaused(false)}
          onMouseDown={handleMouseDown} onMouseUp={handleMouseUpOrLeave} onMouseMove={handleMouseMove}
        >
          {displaySliders.map((product, idx) => {
            const inCartQty = getQtyInCart(product.sku);
            return (
              <ProductCard
                key={`${product.sku}-${idx}`}
                product={product}
                inCartQty={inCartQty}
                onAdd={handleAddToCart}
                variant="slider"
                isFavorite={favorites?.includes(product.sku)}
                onToggleFavorite={onToggleFavorite}
                lastOrderedQty={lastQtyBySku?.[product.sku]}
                lowStockThreshold={lowStockThreshold}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};