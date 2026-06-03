import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import vendorRoutes from './routes/vendorRoutes';
import orderRoutes from './routes/orderRoutes';
import settingsRoutes from './routes/settingsRoutes';

const app = express();

const ALLOWED_ORIGINS = [
  'http://localhost:5173', 
  'http://localhost:3000', 
  'https://web-site-sul-congelados-1.onrender.com'
];
if (process.env.FRONTEND_URL) ALLOWED_ORIGINS.push(process.env.FRONTEND_URL);

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));

app.use(express.json());

// 🚀 LOG DE RUTAS (DEBUG PROFESIONAL)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Declaración de módulos limpios - Last Deploy: 2026-06-02
app.get('/api/db-check', async (req, res) => {
  try {
    const { pool } = await import('./config/db');
    const tables = ['orders', 'settings', 'users', 'products'];
    const counts: Record<string, number> = {};
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      counts[table] = parseInt(result.rows[0].count);
    }
    res.json({ database: 'connected', counts, time: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ping', (req, res) => res.json({ status: 'ok', time: new Date().toISOString(), routes: ['auth', 'products', 'vendor', 'orders', 'settings'] }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);

export default app;