import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs'; // <-- Sumamos esta importación arriba

dotenv.config();
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

export const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        sku TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        stock INTEGER NOT NULL DEFAULT 0,
        description TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_prices (
        id SERIAL PRIMARY KEY,
        product_sku TEXT REFERENCES products(sku) ON DELETE CASCADE,
        convenio TEXT NOT NULL,
        precio NUMERIC NOT NULL,
        UNIQUE(product_sku, convenio)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        convenio_asignado TEXT NOT NULL DEFAULT '2x1 Cordoba',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        telefono TEXT,
        domicilio_facturacion TEXT,
        lugar_entrega TEXT,
        dias_entrega_permitidos TEXT, 
        observaciones TEXT
      )
    `);

    // 👤 SEMILLERO: Auto-creamos el Admin por defecto si la tabla quedó vacía
    const userCheck = await pool.query("SELECT COUNT(*) FROM users");
    if (parseInt(userCheck.rows[0].count) === 0) {
      const salt = bcrypt.genSaltSync(10);
      const adminHash = bcrypt.hashSync('admin123', salt);
      
      await pool.query(`
        INSERT INTO users (email, password, role, convenio_asignado) 
        VALUES ('admin@sul.com', $1, 'Admin', '2x1 Cordoba')
      `, [adminHash]);
      
      console.log('👤 Usuario Administrador maestro inyectado con éxito.');
    }

    console.log('📦 Infraestructura relacional y logística sincronizada en Neon.');
  } catch (err: any) {
    console.error('❌ Error inicializando base de datos estructural:', err.message);
  }
};