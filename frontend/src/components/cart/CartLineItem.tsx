import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatPrice } from '../../../utils/currency';

interface CartLineItemProduct {
  sku: string;
  name: string;
  isPromo?: boolean;
  promoPrice?: number;
  unitPrice: number;
}

interface CartLineItemProps {
  product: CartLineItemProduct;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export const CartLineItem: React.FC<CartLineItemProps> = ({ product, quantity, onIncrement, onDecrement, onRemove }) => {
  const unitPrice = (product.isPromo ? product.promoPrice : product.unitPrice) ?? 0;

  return (
    <div className="flex justify-between items-center border-b border-line pb-4">
      <div className="flex-1">
        <p className="text-xs font-bold text-ink">{product.name}</p>
        <div className="flex items-center space-x-2 mt-2">
          <button type="button" onClick={onDecrement} className="w-6 h-6 flex items-center justify-center bg-bg rounded-md text-ink-soft font-bold hover:bg-line cursor-pointer">-</button>
          <span className="text-xs font-bold w-4 text-center">{quantity}</span>
          <button type="button" onClick={onIncrement} className="w-6 h-6 flex items-center justify-center bg-bg rounded-md text-ink-soft font-bold hover:bg-line cursor-pointer">+</button>
        </div>
      </div>
      <div className="flex items-center space-x-3 ml-2">
        <span className="font-black text-sm">${formatPrice(unitPrice * quantity)}</span>
        <button type="button" onClick={onRemove} className="text-danger hover:text-red-700 cursor-pointer p-1"><Trash2 size={16}/></button>
      </div>
    </div>
  );
};
