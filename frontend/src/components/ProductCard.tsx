import React from 'react';
import { ShoppingCart, Snowflake, Truck, Package } from 'lucide-react';
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
}

interface ProductCardProps {
  product: ProductCardProduct;
  inCartQty: number;
  onAdd: (product: any) => void;
  /** 'grid' = tarjeta de catálogo completa. 'slider' = versión compacta para el carrusel. */
  variant?: 'grid' | 'slider';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, inCartQty, onAdd, variant = 'grid' }) => {
  const { user } = useAuth();
  const price = product.isPromo ? product.promoPrice : product.unitPrice;
  const isSlider = variant === 'slider';

  const diasEntregaList = user?.diasEntrega
    ? (typeof user.diasEntrega === 'string' ? user.diasEntrega.split(',') : user.diasEntrega)
    : [];
  const diasEntregaLabel = diasEntregaList.length > 0
    ? diasEntregaList.map(d => DIA_ABREVIADO[d.trim()] || d.trim()).join(', ')
    : null;
  const isCombo = product.category?.toLowerCase() === 'combos';

  return (
    <div
      className={`bg-paper rounded-card border p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden ${
        isSlider ? 'w-64 shrink-0' : ''
      } ${inCartQty > 0 ? 'border-brand-gold' : 'border-line'}`}
    >
      {product.isPromo && (
        <div className="absolute top-0 right-0 bg-brand-gold text-brand-gold-on text-[9px] font-black px-3 py-1 uppercase tracking-widest shadow-sm rounded-bl-xl">
          OFERTA
        </div>
      )}

      <div className={product.isPromo ? 'pt-4' : ''}>
        <div className="w-full aspect-4/3 mb-3 rounded-lg bg-brand-gold/10 flex items-center justify-center">
          <CategoryIcon category={product.category} name={product.name} className="text-brand-gold-deep" size={isSlider ? 32 : 40} />
        </div>
        <span className="text-[10px] font-black tracking-widest text-ink-soft uppercase">{product.category}</span>
        <h3 className="font-bold text-ink text-sm leading-tight mb-1 mt-1">{product.name}</h3>
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
          </div>
        )}
        {!isSlider && <p className="text-ink-soft text-[11px] font-mono-label mb-3">SKU: {product.sku}</p>}
        {!isSlider && product.description && (
          <p className="text-ink-soft text-xs line-clamp-2 mb-4">{product.description}</p>
        )}
      </div>

      <div className="mt-4">
        <div className="mb-3">
          {product.isPromo ? (
            <div className="flex items-baseline space-x-2">
              <span className="text-lg font-black text-ink">${formatPrice(product.promoPrice ?? 0)}</span>
              <span className="text-xs text-ink-soft line-through">${formatPrice(product.unitPrice ?? 0)}</span>
            </div>
          ) : (
            <span className="text-lg font-black text-ink">${formatPrice(price ?? 0)}</span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(product); }}
          className={`w-full font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer relative z-20 ${
            inCartQty > 0 ? 'bg-brand-gold text-brand-gold-on hover:bg-brand-gold-deep' : 'bg-brand-primary text-brand-primary-on hover:bg-brand-accent'
          }`}
        >
          <ShoppingCart size={14} />
          <span>{inCartQty > 0 ? `Añadir otro (${inCartQty})` : 'Añadir al Pedido'}</span>
        </button>
      </div>
    </div>
  );
};
