import { Request, Response } from 'express';
import { pool } from '../config/db';
import * as XLSX from 'xlsx';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sul_secreto_super_seguro_2026';

export const getProductsByConvenio = async (req: Request, res: Response) => {
  let userConvenio = 'CORDOBA'; // Base por defecto

  // 🕵️‍♂️ INTERCEPTOR: Leemos el token limpio
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.convenio) {
        userConvenio = decoded.convenio; 
      }
    } catch (err) {
      console.log('Aviso: Token opcional inválido o vencido, usando lista base CORDOBA.');
    }
  }

  try {
    const query = `
      SELECT p.sku, p.name, p.category, p.subcategory, p.stock, p.description, pr.precio
      FROM products p
      INNER JOIN product_prices pr ON p.sku = pr.product_sku
      WHERE UPPER(TRIM(pr.convenio)) = UPPER(TRIM($1))
      ORDER BY p.name ASC
    `;
    const result = await pool.query(query, [userConvenio]);
    
    const standardized = result.rows.map(row => ({
      sku: row.sku,
      name: row.name, // ✅ Trazador eliminado: vuelve a mostrar el nombre puro del producto
      category: row.category,
      subcategory: row.subcategory,
      stock: row.stock,
      description: row.description,
      unitPrice: parseFloat(row.precio)
    }));
    
    res.json(standardized);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo catálogo' });
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

      for (const rawRow of rows) {
        // 🔄 NORMALIZADOR INTELIGENTE DE COLUMNAS (Pasa a minúsculas y elimina acentos)
        const row: any = {};
        for (const k of Object.keys(rawRow)) {
          const cleanKey = k.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          row[cleanKey] = rawRow[k];
        }

        // 🔍 Mapeo tolerante a variantes comunes de tu sistema comercial
        const codigo = row.codigo || row.code || row.sku;
        const descrip = row.descrip || row.descripcion || row.name || row.nombre || row.articulo;
        const preciofinal = row.preciofinal || row.precio || row.precio_final || row.monto;
        const convenio = row.convenio || row.lista || row.nombre_lista || row.convenios;
        
        const rubro = row.rubro_descrip || row.rubro || row.category || row.categoria || 'Varios';
        const subrubro = row.subrubro_descrip || row.subrubro || row.subcategory || row.subcategoria || 'Varios';

        if (codigo && descrip && preciofinal && convenio) {
          await client.query(`
            INSERT INTO products (sku, name, category, subcategory, stock)
            VALUES ($1, $2, $3, $4, 100)
            ON CONFLICT (sku) DO UPDATE 
            SET name = $2, category = $3, subcategory = $4
          `, [
            String(codigo).trim(), 
            String(descrip).trim(), 
            String(rubro).trim(), 
            String(subrubro).trim()
          ]);

          await client.query(`
            INSERT INTO product_prices (product_sku, convenio, precio)
            VALUES ($1, $2, $3)
            ON CONFLICT (product_sku, convenio) DO UPDATE 
            SET precio = $3
          `, [
            String(codigo).trim(), 
            String(convenio).trim(), 
            parseFloat(preciofinal)
          ]);

          processed++;
        }
      }

      await client.query('COMMIT');
      res.json({ message: `Sincronización exitosa. Se procesaron e inyectaron ${processed} productos en Neon.` });
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