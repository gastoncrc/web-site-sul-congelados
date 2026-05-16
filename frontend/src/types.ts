export interface Product {
  sku: string;
  name: string;
  category: string;
  stock: number;
  description: string;
  unitPrice: number;
}

export interface User {
  email: string;
  role: 'Admin' | 'Mayorista' | 'Distribuidor' | 'Minorista';
}

export interface CartItem {
  product: Product;
  quantity: number;
}