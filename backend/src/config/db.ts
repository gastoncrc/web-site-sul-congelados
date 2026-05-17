import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

export const initDB = async () => {
  try {
    // 1. Tabla base de Productos (Catálogo físico)
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

    // 2. Tabla Relacional de Precios por Convenio
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_prices (
        id SERIAL PRIMARY KEY,
        product_sku TEXT REFERENCES products(sku) ON DELETE CASCADE,
        convenio TEXT NOT NULL,
        precio NUMERIC NOT NULL,
        UNIQUE(product_sku, convenio)
      )
    `);

    // 3. Tabla Avanzada de Usuarios (Control logístico y comercial)
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

    console.log('📦 Infraestructura relacional y logística sincronizada en Neon.');
  } catch (err: any) {
    console.error('❌ Error inicializando base de datos estructural:', err.message);
  }
};