import React from 'react';
import { ShoppingCart, Snowflake, Truck, Package, Star, AlertTriangle } from 'lucide-react';
import { formatPrice } from '../../utils/currency';
import { CategoryIcon } from './CategoryIcon';
import { useAuth } from '../context/AuthContext';

const DIA_ABREVIADO: Record<string, string> = {
  Lunes: 'Lun', Martes: 'Mar', Miércoles: 'Mié', Jueves: 'Jue', Viernes: 'Vie', Sábado: 'Sáb', Domingo: 'Dom',
};

interface ProductCardProduct {
  sku: string;
  name: string;
  category: string;
  description?: string;
  unitPrice: number;
  isPromo?: boolean;
  promoPrice?: number;
  packageSize?: number;
  stock?: number;
  imageUrl?: string;
}

interface ProductCardProps {
  product: ProductCardProduct;
  inCartQty: number;
  onAdd: (product: any) => void;
  /** 'grid' = tarjeta de catálogo completa. 'slider' = versión compacta para el carrusel. */
  variant?: 'grid' | 'slider';
  isFavorite?: boolean;
  onToggleFavorite?: (sku: string) => void;
  lastOrderedQty?: number;
  lowStockThreshold?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, inCartQty, onAdd, variant = 'grid', isFavorite, onToggleFavorite, lastOrderedQty, lowStockThreshold }) => {
  const { user } = useAuth();
  const price = product.isPromo ? product.promoPrice : product.unitPrice;
  const isSlider = variant === 'slider';
  const isLowStock = typeof product.stock === 'number' && typeof lowStockThreshold === 'number' && product.stock > 0 && product.stock < lowStockThreshold;

  const diasEntregaList = user?.diasEntrega
    ? (typeof user.diasEntrega === 'string' ? user.diasEntrega.split(',') : user.diasEntrega)
    : [];
  const diasEntregaLabel = diasEntregaList.length > 0
    ? diasEntregaList.map(d => DIA_ABREVIADO[d.trim()] || d.trim()).join(', ')
    : null;
  const isCombo = product.category?.toLowerCase() === 'combos';

  return (
    <div
      className={`bg-paper rounded-card border shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden ${
        isSlider ? 'w-32 sm:w-36 shrink-0 p-2' : 'p-4'
      } ${inCartQty > 0 ? 'border-brand-gold' : 'border-line'}`}
    >
      {product.isPromo && (
        <div className={`absolute top-0 right-0 bg-brand-gold text-brand-gold-on font-black uppercase tracking-widest shadow-sm rounded-bl-xl ${isSlider ? 'text-[7px] px-1.5 py-0.5' : 'text-[9px] px-3 py-1'}`}>
          OFERTA
        </div>
      )}

      {user && onToggleFavorite && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.sku); }}
          className={`absolute z-20 rounded-full bg-paper/90 shadow-sm flex items-center justify-center text-ink-soft hover:text-brand-gold-deep transition cursor-pointer ${isSlider ? 'top-1 left-1 w-5 h-5' : 'top-2 left-2 w-7 h-7'}`}
          title="Marcar como habitual"
        >
          <Star size={isSlider ? 10 : 14} className={isFavorite ? 'fill-brand-gold text-brand-gold-deep' : ''} />
        </button>
      )}

      <div className={product.isPromo && !isSlider ? 'pt-4' : ''}>
        <div className={`w-full rounded-lg bg-brand-gold/10 flex items-center justify-center overflow-hidden ${isSlider ? 'aspect-square mb-1.5' : 'aspect-4/3 mb-3'}`}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <CategoryIcon category={product.category} name={product.name} className="text-brand-gold-deep" size={isSlider ? 22 : 40} />
          )}
        </div>
        {!isSlider && <span className="text-[10px] font-black tracking-widest text-ink-soft uppercase">{product.category}</span>}
        <h3 className={isSlider ? 'font-bold text-ink text-[11px] leading-tight line-clamp-2' : 'font-bold text-ink text-sm leading-tight mb-1 mt-1'}>{product.name}</h3>
        {!isSlider && (
          <div className="flex flex-wrap gap-1 mb-2">
            {isCombo && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded bg-brand-accent text-white">
                Combo
              </span>
            )}
            {!!product.packageSize && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded bg-line/60 text-ink-soft">
                <Package size={10} /> Caja x{product.packageSize}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded bg-line/60 text-ink-soft">
              <Snowflake size={10} /> Cadena de frío
            </span>
            {diasEntregaLabel && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded bg-brand-gold/15 text-brand-gold-deep">
                <Truck size={10} /> Reparto {diasEntregaLabel}
              </span>
            )}
            {isLowStock && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded bg-warning/15 text-warning">
                <AlertTriangle size={10} /> Últimas unidades
              </span>
            )}
          </div>
        )}
        {!isSlider && (
          <p className="text-ink-soft text-[11px] font-mono-label mb-3">
            SKU: {product.sku}
            {lastOrderedQty ? ` · Última vez: ${lastOrderedQty}` : ''}
          </p>
        )}
        {!isSlider && product.description && (
          <p className="text-ink-soft text-xs line-clamp-2 mb-4">{product.description}</p>
        )}
      </div>

      <div className={isSlider ? 'mt-1.5' : 'mt-4'}>
        <div className={isSlider ? 'mb-1.5' : 'mb-3'}>
          {product.isPromo ? (
            <div className={`flex items-baseline ${isSlider ? 'gap-1 flex-wrap' : 'space-x-2'}`}>
              <span className={isSlider ? 'text-xs font-black text-ink' : 'text-lg font-black text-ink'}>${formatPrice(product.promoPrice ?? 0)}</span>
              <span className={isSlider ? 'text-[9px] text-ink-soft line-through' : 'text-xs text-ink-soft line-through'}>${formatPrice(product.unitPrice ?? 0)}</span>
            </div>
          ) : (
            <span className={isSlider ? 'text-xs font-black text-ink' : 'text-lg font-black text-ink'}>${formatPrice(price ?? 0)}</span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(product); }}
          className={`w-full font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer relative z-20 ${
            isSlider ? 'py-1.5 text-[10px] gap-1' : 'py-2.5 text-xs space-x-2'
          } ${
            inCartQty > 0 ? 'bg-brand-gold text-brand-gold-on hover:bg-brand-gold-deep' : 'bg-brand-primary text-brand-primary-on hover:bg-brand-accent'
          }`}
        >
          <ShoppingCart size={isSlider ? 11 : 14} />
          <span>{isSlider ? (inCartQty > 0 ? `En pedido (${inCartQty})` : 'Agregar') : (inCartQty > 0 ? `Añadir otro (${inCartQty})` : 'Añadir al Pedido')}</span>
        </button>
      </div>
    </div>
  );
};
