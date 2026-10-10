import React from 'react';
import {
  Beef, Drumstick, Fish, Ham, Shrimp, Salad, Carrot, Apple,
  Wheat, Milk, Pizza, Sandwich, Soup, Egg, Snowflake, type LucideProps,
} from 'lucide-react';

// No hay fotografía de producto todavía (el tipo Product no tiene campo de imagen).
// Mapeo por palabra clave de categoría/nombre a un ícono representativo; Snowflake
// como fallback liga con la cadena de frío sin caer en el celeste de freezer de
// supermercado (va siempre en dorado, nunca en azul).
const ICON_RULES: Array<{ keywords: string[]; Icon: React.FC<LucideProps> }> = [
  { keywords: ['pollo', 'ave', 'gallina'], Icon: Drumstick },
  { keywords: ['pescado', 'pesca', 'atun', 'merluza', 'salmon'], Icon: Fish },
  { keywords: ['camaron', 'langostino', 'marisco', 'mariscos'], Icon: Shrimp },
  { keywords: ['cerdo', 'jamon', 'bondiola', 'panceta'], Icon: Ham },
  { keywords: ['vacuno', 'carne', 'bife', 'asado', 'milanesa', 'achura'], Icon: Beef },
  { keywords: ['verdura', 'vegetal', 'ensalada'], Icon: Salad },
  { keywords: ['zanahoria', 'papa', 'batata'], Icon: Carrot },
  { keywords: ['fruta'], Icon: Apple },
  { keywords: ['pan', 'panificado', 'panaderia', 'masa', 'facturas'], Icon: Wheat },
  { keywords: ['lacteo', 'leche', 'queso', 'crema'], Icon: Milk },
  { keywords: ['pizza'], Icon: Pizza },
  { keywords: ['lomito', 'hamburguesa', 'sandwich'], Icon: Sandwich },
  { keywords: ['sopa', 'caldo'], Icon: Soup },
  { keywords: ['huevo'], Icon: Egg },
];

const DIACRITICS = new RegExp('[̀-ͯ]', 'g');
const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(DIACRITICS, '');

export const getCategoryIcon = (...labels: Array<string | undefined>): React.FC<LucideProps> => {
  const text = normalize(labels.filter(Boolean).join(' '));
  const match = ICON_RULES.find(rule => rule.keywords.some(kw => text.includes(kw)));
  return match ? match.Icon : Snowflake;
};

export const CategoryIcon: React.FC<{ category?: string; subcategory?: string; name?: string; size?: number; className?: string }> = ({
  category, subcategory, name, size = 28, className = '',
}) => {
  const Icon = getCategoryIcon(category, subcategory, name);
  return <Icon size={size} className={className} strokeWidth={1.75} />;
};
