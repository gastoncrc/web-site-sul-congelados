// Carga productos de ejemplo en el backend LOCAL (no en Neon/producción).
// Pensado para correr contra el backend levantado con DATABASE_URL apuntando
// al Postgres descartable de Docker (ver backend/scripts/README-local-dev.md).
//
// Uso: node scripts/seed-local-test-data.js [URL_BASE_API]
// Default URL_BASE_API: http://127.0.0.1:4001/api

const BASE = process.argv[2] || 'http://127.0.0.1:4001/api';

const products = [
  { sku: 'LOM-001', name: 'Lomito de Ternera Premium x 5u', category: 'Carnes', subcategory: 'Vacuno', stock: 50, description: 'Corte seleccionado, congelado IQF', unitPrice: 15000, is_active: true, is_promo: false, in_slider: true },
  { sku: 'HAM-002', name: 'Hamburguesa Clasica x 10u', category: 'Carnes', subcategory: 'Vacuno', stock: 30, description: 'Medallones 120g', unitPrice: 9000, is_active: true, is_promo: true, promo_price: 7200, in_slider: true },
  { sku: 'MIL-003', name: 'Milanesa de Pollo x 8u', category: 'Pollo', subcategory: 'Milanesas', stock: 20, description: 'Apanada, lista para freir', unitPrice: 8500, is_active: true, is_promo: false, in_slider: true },
  { sku: 'PIZ-004', name: 'Pizza Muzzarella x 4u', category: 'Panificados', subcategory: 'Pizzas', stock: 15, description: 'Masa artesanal', unitPrice: 6000, is_active: true, is_promo: false, in_slider: false },
  { sku: 'EMP-005', name: 'Empanadas de Carne x 12u', category: 'Panificados', subcategory: 'Empanadas', stock: 40, description: 'Receta criolla, horneadas', unitPrice: 7200, is_active: true, is_promo: false, in_slider: false },
  { sku: 'VEG-006', name: 'Milanesa de Soja x 10u', category: 'Verduras', subcategory: 'Vegetarianas', stock: 12, description: 'Opcion vegetariana', unitPrice: 6800, is_active: true, is_promo: true, promo_price: 5500, in_slider: false },
];

async function main() {
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@sul.com', password: 'admin123' }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) { console.error('Login falló (¿el backend de prueba está corriendo?):', loginData); process.exit(1); }
  const token = loginData.token;
  console.log('Login OK como admin@sul.com.');

  for (const p of products) {
    const res = await fetch(`${BASE}/products/individual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(p),
    });
    console.log(p.sku, res.status);

    const priceRes = await fetch(`${BASE}/products/individual-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sku: p.sku, convenio: 'CORDOBA', precio: p.unitPrice }),
    });
    console.log(p.sku, 'precio', priceRes.status);
  }

  console.log('Listo. Catálogo de prueba cargado.');
}

main().catch(err => { console.error(err); process.exit(1); });
