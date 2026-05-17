import { Request, Response } from 'express';
import { pool } from '../config/db';
import csv from 'csv-parser';
import stream from 'stream';

export const getProductsByConvenio = async (req: Request, res: Response) => {
  // Si no está logueado, forzamos convenio "2x1 Cordoba". Si está logueado, toma su convenio real.
  const userConvenio = req.user ? req.user.convenio : '2x1 Cordoba';

  try {
    const query = `
      SELECT p.sku, p.name, p.category, p.subcategory, p.stock, p.description, pr.precio
      FROM products p
      INNER JOIN product_prices pr ON p.sku = pr.product_sku
      WHERE pr.convenio = $1
      ORDER BY p.name ASC
    `;
    const result = await pool.query(query, [userConvenio]);

    // Homologamos la salida para que el Frontend siga leyendo "unitPrice" de forma transparente
    const standardized = result.rows.map(row => ({
      sku: row.sku,
      name: row.name,
      category: row.category,
      subcategory: row.subcategory,
      stock: row.stock,
      description: row.description,
      unitPrice: parseFloat(row.precio)
    }));

    res.json(standardized);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo catálogo de convenios' });
  }
};

// Inyector del Excel (Soporta las columnas exactas de tu exportador de sistema)
export const uploadCsvConvenios = async (req: Request, res: Response) => {
  if (req.user?.role !== 'Admin') return res.status(403).json({ error: 'Permisos insuficientes' });
  if (!req.file) return res.status(400).json({ error: 'Archivo no suministrado' });

  const rows: any[] = [];
  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.file.buffer);

  bufferStream
    .pipe(csv())
    .on('data', (data) => rows.push(data))
    .on('end', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        let processed = 0;

        for (const row of rows) {
          // Captura de tus columnas reales del Excel: codigo, descrip, preciofinal, convenio, rubro_descrip, subrubro_descrip
          if (row.codigo && row.descrip && row.preciofinal && row.convenio) {
            
            // 1. Upsert del Producto Base
            await client.query(`
              INSERT INTO products (sku, name, category, subcategory, stock)
              VALUES ($1, $2, $3, $4, 100)
              ON CONFLICT (sku) DO UPDATE 
              SET name = $2, category = $3, subcategory = $4
            `, [row.codigo, row.descrip, row.rubro_descrip || 'Varios', row.subrubro_descrip || 'Varios']);

            // 2. Upsert de la matriz de precios por Convenio
            await client.query(`
              INSERT INTO product_prices (product_sku, convenio, precio)
              VALUES ($1, $2, $3)
              ON CONFLICT (product_sku, convenio) DO UPDATE 
              SET precio = $3
            `, [row.codigo, row.convenio, parseFloat(row.preciofinal)]);

            processed++;
          }
        }

        await client.query('COMMIT');
        res.json({ message: `Sincronización finalizada. Se procesaron ${processed} registros del sistema comercial.` });
      } catch (err: any) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Falla al inyectar matriz de convenios relacionales' });
      } finally {
        client.release();
      }
    });
};

// Panel Admin: Creación o edición manual de un producto individual
export const adminUpsertProductManual = async (req: Request, res: Response) => {
  if (req.user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });
  const { sku, name, category, subcategory, description, stock, preciosPorConvenio } = req.body; 
  // preciosPorConvenio esperado: { "2x1 Cordoba": 324333, "Interior": 40808 }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      INSERT INTO products (sku, name, category, subcategory, description, stock)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (sku) DO UPDATE 
      SET name = $2, category = $3, subcategory = $4, description = $5, stock = $6
    `, [sku, name, category, subcategory, description, stock]);

    for (const [convenio, precio] of Object.entries(preciosPorConvenio)) {
      await client.query(`
        INSERT INTO product_prices (product_sku, convenio, precio)
        VALUES ($1, $2, $3)
        ON CONFLICT (product_sku, convenio) DO UPDATE SET precio = $3
      `, [sku, convenio, precio]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Producto e historial de convenios guardado a mano con éxito' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Error en inserción manual' });
  } finally {
    client.release();
  }
};