import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import csv from 'csv-parser';
import stream from 'stream';
import dotenv from 'dotenv';

// Extensión global para que TypeScript reconozca el usuario en las peticiones de Express
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: 'Admin' | 'Mayorista' | 'Distribuidor' | 'Minorista';
        email: string;
      };
    }
  }
}

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'sul_secreto_super_seguro_2026';

// Configuración de CORS dinámica para Producción y Local
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://sul-congelados-web.onrender.com' // Tu dominio del frontend de Render
];

// Si tenés configurada la variable en el entorno, la sumamos al array
if (process.env.FRONTEND_URL) {
  ALLOWED_ORIGINS.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Permitimos peticiones sin origin (como apps móviles, curl o herramientas internas)
    // o si el origen está explícitamente dentro de nuestra lista permitida
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`🛑 Origen bloqueado por CORS: ${origin}`);
      callback(new Error('Bloqueado por políticas CORS de SUL'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Conexión a PostgreSQL (Detecta automáticamente si estás local o en la nube)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

// Inicialización de Tablas en PostgreSQL
async function initDB() {
  try {
    // Tabla de Usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      )
    `);

    // Tabla de Productos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        sku TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        stock INTEGER NOT NULL,
        description TEXT,
        price_minorista NUMERIC NOT NULL,
        price_mayorista NUMERIC NOT NULL,
        price_distribuidor NUMERIC NOT NULL
      )
    `);

    // Inyectar usuarios por defecto si no existen
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('admin123', salt);
    const clientHash = bcrypt.hashSync('cliente123', salt);

    await pool.query(`
      INSERT INTO users (email, password, role) 
      VALUES ('admin@sul.com', $1, 'Admin') 
      ON CONFLICT (email) DO NOTHING
    `, [adminHash]);

    await pool.query(`
      INSERT INTO users (email, password, role) 
      VALUES ('mayorista@sul.com', $1, 'Mayorista') 
      ON CONFLICT (email) DO NOTHING
    `, [clientHash]);

    // Inyectar catálogo inicial si está vacío
    const prodCheck = await pool.query("SELECT COUNT(*) FROM products");
    if (parseInt(prodCheck.rows[0].count) === 0) {
      const insertQuery = `
        INSERT INTO products (sku, name, category, stock, description, price_minorista, price_mayorista, price_distribuidor)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      await pool.query(insertQuery, ['SUL-001', 'Lomos de Salmón Premium (Caja 10kg)', 'Pescados', 150, 'Corte premium congelado en origen.', 150000, 135000, 120000]);
      await pool.query(insertQuery, ['SUL-002', 'Mix Vegetales Salteados (Caja 15kg)', 'Vegetales', 320, 'Brócoli, coliflor, zanahoria y arvejas.', 45000, 38000, 32000]);
      await pool.query(insertQuery, ['SUL-003', 'Pulpas de Cerdo Seleccionada (Caja 20kg)', 'Carnes', 80, 'Pork pulp tiernizada lista para procesar.', 98000, 89000, 81000]);
      console.log('🌱 Productos por defecto inyectados en PostgreSQL.');
    }

    console.log('📦 Infraestructura conectada y sincronizada con PostgreSQL.');
  } catch (err: any) {
    console.error('❌ Error inicializando la base de datos:', err.message);
  }
}

initDB();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Interfaces para tipado estricto
interface UserRow {
  id: number;
  email: string;
  password?: string;
  role: 'Admin' | 'Mayorista' | 'Distribuidor' | 'Minorista';
}

// ==================== RUTAS DE LA API ====================

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user: UserRow = result.rows[0];

    if (!user || !user.password) return res.status(401).json({ error: 'Credenciales inválidas' });

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '8h' });

    res.status(200).json({
      token,
      user: { email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
});

// Middleware JWT
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'No se proporcionó un token' });

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) return res.status(401).json({ error: 'Token inválido o expirado' });
    req.user = decoded;
    next();
  });
};

// Obtener Productos
app.get('/api/products', verifyToken, async (req: Request, res: Response) => {
  const role = req.user?.role || 'Minorista';
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY name ASC");
    
    const customizedProducts = result.rows.map(p => {
      let price = parseFloat(p.price_minorista);
      if (role === 'Mayorista') price = parseFloat(p.price_mayorista);
      if (role === 'Distribuidor' || role === 'Admin') price = parseFloat(p.price_distribuidor);

      return {
        sku: p.sku,
        name: p.name,
        category: p.category,
        stock: p.stock,
        description: p.description,
        unitPrice: price
      };
    });

    res.json(customizedProducts);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Procesar CSV masivo con Transacciones SQL complejas
app.post('/api/products/upload-prices', verifyToken, upload.single('file'), (req: Request, res: Response) => {
  if (req.user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado.' });
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo.' });

  const results: any[] = [];
  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.file.buffer);

  bufferStream
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('error', () => res.status(500).json({ error: 'Error al procesar CSV' }))
    .on('end', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        let updatedCount = 0;

        for (const row of results) {
          if (row.SKU && row.Minorista && row.Mayorista && row.Distribuidor) {
            await client.query(`
              UPDATE products 
              SET price_minorista = $1, price_mayorista = $2, price_distribuidor = $3 
              WHERE sku = $4
            `, [row.Minorista, row.Mayorista, row.Distribuidor, row.SKU]);
            updatedCount++;
          }
        }

        await client.query('COMMIT');
        res.json({ message: `Se actualizaron ${updatedCount} productos correctamente en la base central.` });
      } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Error al impactar los cambios en la base de datos' });
      } finally {
        client.release();
      }
    });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Enterprise corriendo en el puerto ${PORT}`);
});