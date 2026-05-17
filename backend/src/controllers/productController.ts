import { Request, Response } from 'express';
import { pool } from '../config/db';
import * as XLSX from 'xlsx';
import jwt from 'jsonwebtoken'; // Maximizamos la lectura nativa

const JWT_SECRET = process.env.JWT_SECRET || 'sul_secreto_super_seguro_2026';

export const getProductsByConvenio = async (req: Request, res: Response) => {
  let userConvenio = 'CORDOBA'; // Por defecto, la ley de la calle para anónimos

  // 🕵️‍♂️ INTERCEPTOR INVISIBLE: Si el cliente está logueado, leemos su contrato ERP
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.convenio) {
        userConvenio = decoded.convenio; // Le pisamos la lista por la de su franquicia/convenio real
      }
    } catch (err) {
      // Si el token expiró o falló, no rompemos la app, tiramos el fallback base
      console.log('Aviso: Token opcional inválido o vencido, usando lista base CORDOBA.');
    }
  }

  try {
    const query = `
      SELECT p.sku, p.name, p.category, p.subcategory, p.stock, p.description, pr.precio
      FROM products p
      INNER JOIN product_prices pr ON p.sku = pr.product_sku
      WHERE pr.convenio = $1
      ORDER BY p.name ASC
    `;
    const result = await pool.query(query, [userConvenio]);
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

export const uploadCsvConvenios = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Permisos insuficientes' });
  if (!req.file) return res.status(400).json({ error: 'Archivo no suministrado' });

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let processed = 0;

      for (const row of rows) {
        if (row.codigo && row.descrip && row.preciofinal && row.convenio) {
          
          await client.query(`
            INSERT INTO products (sku, name, category, subcategory, stock)
            VALUES ($1, $2, $3, $4, 100)
            ON CONFLICT (sku) DO UPDATE 
            SET name = $2, category = $3, subcategory = $4
          `, [
            String(row.codigo).trim(), 
            String(row.descrip).trim(), 
            String(row.rubro_descrip || 'Varios').trim(), 
            String(row.subrubro_descrip || 'Varios').trim()
          ]);

          await client.query(`
            INSERT INTO product_prices (product_sku, convenio, precio)
            VALUES ($1, $2, $3)
            ON CONFLICT (product_sku, convenio) DO UPDATE 
            SET precio = $3
          `, [
            String(row.codigo).trim(), 
            String(row.convenio).trim(), 
            parseFloat(row.preciofinal)
          ]);

          processed++;
        }
      }

      await client.query('COMMIT');
      res.json({ message: `Sincronización finalizada. Se procesaron ${processed} registros.` });
    } catch (err: any) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'Falla al inyectar matriz de convenios relacionales' });
    } finally {
      client.release();
    }
  } catch (globalErr: any) {
    res.status(400).json({ error: 'El archivo no tiene un formato válido de Excel.' });
  }
};