import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

export const initDB = async () => {
  try {
    // 1. Tabla de Productos (Catálogo Base)
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

    // 2. Matriz de Precios por Convenio Cruzado
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_prices (
        id SERIAL PRIMARY KEY,
        product_sku TEXT REFERENCES products(sku) ON DELETE CASCADE,
        convenio TEXT NOT NULL,
        precio NUMERIC NOT NULL,
        UNIQUE(product_sku, convenio)
      )
    `);

    // 3. Tabla Avanzada de Usuarios Logísticos (ERP SUL)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        client_code TEXT UNIQUE,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        convenio_asignado TEXT NOT NULL DEFAULT '2x1 Cordoba',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        require_password_change BOOLEAN NOT NULL DEFAULT FALSE,
        telefono TEXT,
        domicilio_facturacion TEXT,
        lugar_entrega TEXT,
        dias_entrega_permitidos TEXT,
        observaciones TEXT
      )
    `);

    // ========================================================
    // ASIGNACIÓN AUTOMÁTICA DE CREDENCIALES COMPATIBLES (Node)
    // ========================================================

    // 1. Aseguramos que el Administrador Maestro exista y tenga el hash correcto
    const adminCheck = await pool.query("SELECT * FROM users WHERE email = 'admin@sul.com'");
    const adminHash = bcrypt.hashSync('admin123', bcrypt.genSaltSync(10));

    if (adminCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO users (email, password, role, convenio_asignado, is_active) 
        VALUES ('admin@sul.com', $1, 'Admin', '2x1 Cordoba', TRUE)
      `, [adminHash]);
      console.log('👤 Admin creado con éxito por el sistema.');
    } else {
      // Si ya existía de antes, le pisamos la clave con el hash de Node por seguridad
      await pool.query("UPDATE users SET password = $1 WHERE email = 'admin@sul.com'", [adminHash]);
    }

    // 2. Aseguramos que el Cliente de prueba exista y tenga el hash correcto
    const clientCheck = await pool.query("SELECT * FROM users WHERE email = 'cliente@sul.com'");
    const clientHash = bcrypt.hashSync('SULcongelados2026', bcrypt.genSaltSync(10));

    if (clientCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO users (client_code, name, email, password, role, convenio_asignado, is_active, require_password_change) 
        VALUES ('999999', 'LOCAL TEST MANUAL', 'cliente@sul.com', $1, 'Cliente', '2x1 Cordoba', TRUE, TRUE)
      `, [clientHash]);
      console.log('👥 Cliente de prueba creado con éxito por el sistema.');
    } else {
      // Si ya existía, le reseteamos la clave genérica y le activamos el escudo de cambio obligatorio
      await pool.query("UPDATE users SET password = $1, require_password_change = TRUE WHERE email = 'cliente@sul.com'", [clientHash]);
    }

    console.log('📦 Infraestructura relacional y logística sincronizada en Neon.');
  } catch (err: any) {
    console.error('❌ Error inicializando base de datos estructural:', err.message);
  }
};