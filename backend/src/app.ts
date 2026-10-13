import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import vendorRoutes from './routes/vendorRoutes';
import orderRoutes from './routes/orderRoutes';
import settingsRoutes from './routes/settingsRoutes';

const app = express();

// Render (como la mayoría de los PaaS) pone la app detrás de un proxy y agrega
// X-Forwarded-For — sin esto, express-rate-limit no puede identificar la IP real
// de cada cliente para el límite de intentos de login.
app.set('trust proxy', 1);

const ALLOWED_ORIGINS = [
  'http://localhost:5173', 
  'http://localhost:3000', 
  'https://web-site-sul-congelados-1.onrender.com'
];
if (process.env.FRONTEND_URL) ALLOWED_ORIGINS.push(...process.env.FRONTEND_URL.split(',').map(url => url.trim()));

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

// Healthcheck — a propósito NO expone conteos de filas (usuarios/pedidos/productos):
// es una ruta pública sin login, antes le mostraba el volumen de negocio a cualquiera.
app.get('/api/db-check', async (req, res) => {
  try {
    const { pool } = await import('./config/db');
    await pool.query('SELECT 1');
    res.json({ database: 'connected', time: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ database: 'error' });
  }
});

app.get('/api/ping', (req, res) => res.json({ status: 'ok', time: new Date().toISOString(), routes: ['auth', 'products', 'vendor', 'orders', 'settings'] }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);

// Manejador de errores global — sin esto, cualquier error sin capturar (incluido el
// límite de tamaño de Multer) caía en el handler default de Express, que puede
// devolver el stack trace completo al cliente. Acá se loguea server-side y se
// responde siempre JSON genérico, nunca el detalle interno.
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'El archivo es demasiado grande (máximo 10MB).' });
  }
  console.error('🚨 Error no manejado:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

export default app;