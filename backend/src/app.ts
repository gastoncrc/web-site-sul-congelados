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

// Declaración de módulos limpios - Last Deploy: 2026-06-02
app.get('/api/ping', (req, res) => res.json({ status: 'ok', time: new Date().toISOString(), routes: ['auth', 'products', 'vendor', 'orders', 'settings'] }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);

export default app;