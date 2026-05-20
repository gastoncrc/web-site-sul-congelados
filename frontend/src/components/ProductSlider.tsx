import React, { useRef, useState, useEffect } from 'react';
import { Zap, ShoppingCart } from 'lucide-react';
import { formatPrice } from '../../utils/currency';

interface ProductSliderProps {
  sliderProducts: any[];
  getQtyInCart: (sku: string) => number;
  handleAddToCart: (product: any) => void;
}

export const ProductSlider: React.FC<ProductSliderProps> = ({ sliderProducts, getQtyInCart, handleAddToCart }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const minItemsRequired = 8;
  const repeatCount = sliderProducts.length > 0 ? Math.ceil(minItemsRequired / sliderProducts.length) : 1;
  const baseSliders = Array(repeatCount).fill(sliderProducts).flat();
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
    if (sliderProducts.length > 0) animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, [isSliderPaused, sliderProducts.length]);

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
    <div className="w-full mb-10 bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800">
      <div className="flex items-center space-x-2 text-white text-lg font-black uppercase tracking-wider mb-6">
        <Zap className="text-[#deff9a] fill-[#deff9a]" size={22}/> 
        <span>Destacados de la Semana</span>
      </div>
      <div className="w-full overflow-hidden relative rounded-xl">
        <div className="absolute top-0 bottom-0 left-0 w-12 bg-linear-to-r from-slate-900 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 bottom-0 right-0 w-12 bg-linear-to-l from-slate-900 to-transparent z-10 pointer-events-none"></div>
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
              <div key={`${product.sku}-${idx}`} className="w-64 shrink-0 bg-white rounded-2xl p-5 shadow border border-slate-200 flex flex-col justify-between transition-transform hover:-translate-y-1">
                <div>
                  <div className="flex justify-between items-start mb-1 pointer-events-none">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{product.category}</span>
                    {product.isPromo && <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Promo</span>}
                  </div>
                  <h3 className="font-black text-slate-900 text-sm leading-tight mb-2 line-clamp-2 pointer-events-none">{product.name}</h3>
                </div>
                <div className="mt-3">
                  <div className="mb-3 flex items-baseline space-x-2 pointer-events-none">
                    <span className="text-xl font-black text-slate-900">${formatPrice((product.isPromo ? product.promoPrice : product.unitPrice) ?? 0)}</span>
                    {product.isPromo && <span className="text-xs text-slate-400 line-through">${formatPrice(product.unitPrice ?? 0)}</span>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }} className={`w-full font-bold py-2 rounded-xl text-xs transition-all active:scale-95 flex justify-center items-center space-x-2 cursor-pointer relative z-20 ${inCartQty > 0 ? 'bg-[#deff9a] text-slate-900 hover:bg-[#cceb88]' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                    <ShoppingCart size={14} /> <span>{inCartQty > 0 ? `Agregar otro (${inCartQty})` : 'Agregar'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};