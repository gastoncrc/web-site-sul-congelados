export interface Product {
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  stock: number;
  description: string;
  unitPrice: number;
  isActive?: boolean;
  isPromo?: boolean;
  promoPrice?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SULUser {
  email: string;
  role: 'Admin' | 'Mayorista' | 'Distribuidor' | 'Minorista' | 'Cliente';
  convenio?: string;
  name?: string;
  requirePasswordChange?: boolean;
}
