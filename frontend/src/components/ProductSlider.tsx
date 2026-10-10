import React, { useRef, useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { ProductCard } from './ProductCard';

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
    <div className="w-full mb-10 bg-brand-primary rounded-3xl p-6 md:p-8 shadow-xl">
      <div className="flex items-center space-x-2 text-white text-lg font-black uppercase tracking-wider mb-6">
        <Zap className="text-brand-gold fill-brand-gold" size={22}/>
        <span>Destacados de la Semana</span>
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
              <ProductCard key={`${product.sku}-${idx}`} product={product} inCartQty={inCartQty} onAdd={handleAddToCart} variant="slider" />
            );
          })}
        </div>
      </div>
    </div>
  );
};