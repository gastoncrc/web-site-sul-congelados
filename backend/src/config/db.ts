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
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_promo BOOLEAN NOT NULL DEFAULT FALSE,
        promo_price NUMERIC DEFAULT 0,
        in_slider BOOLEAN DEFAULT FALSE
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

    // 3. Tabla Avanzada de Usuarios Logísticos y Clientes B2B
    // (Actualizada con los nombres exactos para que coincida con el controlador)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        client_code TEXT UNIQUE,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        convenio TEXT NOT NULL DEFAULT 'CORDOBA', 
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        require_password_change BOOLEAN NOT NULL DEFAULT FALSE,
        telefono TEXT,
        domicilio_facturacion TEXT,
        lugar_entrega TEXT,
        dias_entrega TEXT,
        observaciones TEXT,
        razon_social TEXT,
        cuit TEXT,
        localidad TEXT,
        provincia TEXT,
        vendedor TEXT,
        grupo TEXT
      )
    `);

    // 4. Tabla de Pedidos (Cabecera)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT,
        delivery_address TEXT,
        delivery_type TEXT, -- 'Envio' o 'Retiro'
        delivery_date TEXT, -- Para clientes B2B
        payment_method TEXT,
        total_amount NUMERIC NOT NULL,
        status TEXT DEFAULT 'Pendiente', -- 'Pendiente', 'Completado', 'Cancelado'
        observations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Tabla de Items de Pedido (Detalle)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_sku TEXT REFERENCES products(sku),
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price NUMERIC NOT NULL,
        subtotal NUMERIC NOT NULL
      )
    `);

    // 6. Tabla de Ajustes Generales (Dinámicos)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // 7. Tabla de Historial de Precios (Auditoría)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS price_history (
        id SERIAL PRIMARY KEY,
        product_sku TEXT REFERENCES products(sku),
        convenio TEXT NOT NULL,
        old_price NUMERIC,
        new_price NUMERIC NOT NULL,
        changed_by TEXT, -- Email del admin
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Inyectar configuración inicial si no existe
    const wsCheck = await pool.query("SELECT * FROM settings WHERE key = 'whatsapp_number'");
    if (wsCheck.rows.length === 0) {
      await pool.query("INSERT INTO settings (key, value) VALUES ('whatsapp_number', '5493510000000')");
    }

    // ========================================================
    // 🚀 INYECTOR DE ACTUALIZACIÓN DE TABLA (MÁGICO)
    // Esto agrega las columnas a tu DB si ya existía de antes,
    // evitando el error 500 sin tener que borrar tus datos.
    // ========================================================
    const columnasNuevas = [
      'ALTER TABLE users ADD COLUMN convenio TEXT DEFAULT \'CORDOBA\';',
      'ALTER TABLE users ADD COLUMN dias_entrega TEXT;',
      'ALTER TABLE users ADD COLUMN razon_social TEXT;',
      'ALTER TABLE users ADD COLUMN cuit TEXT;',
      'ALTER TABLE users ADD COLUMN localidad TEXT;',
      'ALTER TABLE users ADD COLUMN provincia TEXT;',
      'ALTER TABLE users ADD COLUMN vendedor TEXT;',
      'ALTER TABLE users ADD COLUMN grupo TEXT;'
    ];

    for (const query of columnasNuevas) {
      try {
        await pool.query(query);
      } catch (error) {
        // Se ignora silenciosamente. Si tira error es porque la columna ya existe (¡lo cual es bueno!)
      }
    }

    const columnasNuevasProducts = [
      'ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;',
      'ALTER TABLE products ADD COLUMN is_promo BOOLEAN DEFAULT FALSE;',
      'ALTER TABLE products ADD COLUMN promo_price NUMERIC DEFAULT 0;',
      'ALTER TABLE products ADD COLUMN in_slider BOOLEAN DEFAULT FALSE;'
    ];

    for (const query of columnasNuevasProducts) {
      try {
        await pool.query(query);
      } catch (error) {}
    }

    // ========================================================
    // INYECTOR INTELIGENTE (Solo escribe si las cuentas no existen)
    // ========================================================

    // 1. Administrador Maestro
    const adminCheck = await pool.query("SELECT * FROM users WHERE email = 'admin@sul.com'");
    if (adminCheck.rows.length === 0) {
      const adminHash = bcrypt.hashSync('admin123', bcrypt.genSaltSync(10));
      await pool.query(`
        INSERT INTO users (email, password, role, convenio, is_active) 
        VALUES ('admin@sul.com', $1, 'Admin', 'CORDOBA', TRUE)
      `, [adminHash]);
      console.log('👤 Admin maestro inicializado en la Red CORDOBA.');
    }

    // 2. Cliente de Prueba Manual
    const clientCheck = await pool.query("SELECT * FROM users WHERE email = 'cliente@sul.com'");
    if (clientCheck.rows.length === 0) {
      const clientHash = bcrypt.hashSync('SULcongelados2026', bcrypt.genSaltSync(10));
      await pool.query(`
        INSERT INTO users (client_code, name, email, password, role, convenio, is_active, require_password_change) 
        VALUES ('999999', 'LOCAL TEST MANUAL', 'cliente@sul.com', $1, 'Cliente', '2X1 CORDOBA', TRUE, TRUE)
      `, [clientHash]);
      console.log('👥 Cliente de prueba inicializado en la lista 2X1 CORDOBA.');
    }

    console.log('📦 Infraestructura relacional SUL sincronizada correctamente.');
  } catch (err: any) {
    console.error('❌ Error inicializando base de datos estructural:', err.message);
  }
};