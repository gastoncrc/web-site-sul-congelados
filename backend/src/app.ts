import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';

const app = express();

const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:3000'];
if (process.env.FRONTEND_URL) ALLOWED_ORIGINS.push(process.env.FRONTEND_URL);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
    else callback(new Error('Bloqueado por políticas CORS de SUL'));
  },
  credentials: true
}));

app.use(express.json());

// Declaración de módulos limpios
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

export default app;