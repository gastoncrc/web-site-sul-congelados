import { Request, Response } from 'express';
import { pool } from '../config/db';
import * as XLSX from 'xlsx';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sul_secreto_super_seguro_2026';

const resolveConvenio = (req: Request): string => {
  let userConvenio = 'CORDOBA';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.convenio) userConvenio = decoded.convenio;
    } catch (err) {
      console.log('Aviso: Token opcional inválido o vencido, usando lista base CORDOBA.');
    }
  }
  return userConvenio;
};

const standardizeProductRow = (row: any) => ({
  sku: row.sku,
  name: row.name,
  category: row.category,
  subcategory: row.subcategory,
  stock: row.stock,
  description: row.description,
  isActive: row.is_active,
  isPromo: row.is_promo,
  promoPrice: parseFloat(row.promo_price),
  inSlider: row.in_slider,
  packageSize: row.package_size,
  isNew: row.is_new,
  imageUrl: row.image_url,
  unitPrice: parseFloat(row.precio)
});

const PRODUCT_SELECT_COLUMNS = `p.sku, p.name, p.category, p.subcategory, p.stock, p.description,
       p.is_active, p.is_promo, p.promo_price, p.in_slider, p.package_size, p.is_new, p.image_url, pr.precio`;

// 1. OBTENER CATÁLOGO — paginado y filtrado en el servidor (antes traía
// absolutamente todo el catálogo y el frontend filtraba en memoria).
export const getProductsByConvenio = async (req: Request, res: Response) => {
  const userConvenio = resolveConvenio(req);
  const search = (req.query.search as string || '').trim();
  const category = (req.query.category as string || '').trim();
  const skusParam = (req.query.skus as string || '').trim();

  try {
    // Modo "lookup por SKU exacto" — usado por "repetir pedido" para traer el
    // precio ACTUAL (no el histórico) de una lista puntual de productos, sin paginar.
    if (skusParam) {
      const skuList = skusParam.split(',').map(s => s.trim()).filter(Boolean);
      const result = await pool.query(
        `SELECT ${PRODUCT_SELECT_COLUMNS}
         FROM products p
         INNER JOIN product_prices pr ON p.sku = pr.product_sku
         WHERE UPPER(TRIM(pr.convenio)) = UPPER(TRIM($1)) AND p.is_active = TRUE AND p.sku = ANY($2)`,
        [userConvenio, skuList]
      );
      return res.json({ products: result.rows.map(standardizeProductRow), total: result.rows.length, page: 1, totalPages: 1, categories: [] });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(60, Math.max(1, parseInt(req.query.limit as string) || 24));
    const offset = (page - 1) * limit;

    const filters: string[] = ['UPPER(TRIM(pr.convenio)) = UPPER(TRIM($1))', 'p.is_active = TRUE'];
    const params: any[] = [userConvenio];

    if (search) {
      params.push(`%${search}%`);
      filters.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`);
    }
    if (category && category.toUpperCase() !== 'TODOS') {
      params.push(category);
      filters.push(`p.category = $${params.length}`);
    }
    const whereClause = filters.join(' AND ');

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM products p INNER JOIN product_prices pr ON p.sku = pr.product_sku WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const pageParams = [...params, limit, offset];
    const result = await pool.query(
      `SELECT ${PRODUCT_SELECT_COLUMNS}
       FROM products p
       INNER JOIN product_prices pr ON p.sku = pr.product_sku
       WHERE ${whereClause}
       ORDER BY p.is_promo DESC, p.name ASC
       LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}`,
      pageParams
    );

    const categoriesResult = await pool.query(
      `SELECT DISTINCT p.category FROM products p
       INNER JOIN product_prices pr ON p.sku = pr.product_sku
       WHERE UPPER(TRIM(pr.convenio)) = UPPER(TRIM($1)) AND p.is_active = TRUE
       ORDER BY p.category ASC`,
      [userConvenio]
    );

    res.json({
      products: result.rows.map(standardizeProductRow),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      categories: categoriesResult.rows.map(r => r.category),
    });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo catálogo' });
  }
};

// 1b. Productos destacados para el carrusel de la home — no se pagina
// (el panel admin limita a un máximo de 6 productos destacados).
export const getSliderProducts = async (req: Request, res: Response) => {
  const userConvenio = resolveConvenio(req);
  try {
    const result = await pool.query(
      `SELECT ${PRODUCT_SELECT_COLUMNS}
       FROM products p
       INNER JOIN product_prices pr ON p.sku = pr.product_sku
       WHERE UPPER(TRIM(pr.convenio)) = UPPER(TRIM($1)) AND p.is_active = TRUE AND p.in_slider = TRUE
       ORDER BY p.name ASC`,
      [userConvenio]
    );
    res.json(result.rows.map(standardizeProductRow));
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo destacados' });
  }
};

// 2. CARGA MASIVA — en lotes (antes hacía 3-4 consultas secuenciales POR FILA,
// con un archivo de 500 filas eso eran miles de viajes uno atrás del otro).
const BATCH_SIZE = 500;

export const uploadCsvConvenios = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Permisos insuficientes' });
  if (!req.file) return res.status(400).json({ error: 'Archivo no suministrado' });

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

    // 1. Parsear y validar todas las filas en memoria (igual que antes, sin tocar la DB todavía)
    interface ParsedRow {
      sku: string; name: string; category: string; subcategory: string; convenio: string; price: number;
      basePrice: number | null; markupPercent: number | null;
    }
    const parsedRows: ParsedRow[] = [];
    for (const rawRow of rows) {
      const row: any = {};
      for (const k of Object.keys(rawRow)) {
        const cleanKey = k.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '');
        row[cleanKey] = rawRow[k];
      }
      const codigo = row.codigo || row.code || row.sku;
      const descrip = row.descrip || row.descripcion || row.name || row.nombre || row.articulo;
      const preciofinal = row.preciofinal || row.precio || row.precio_final || row.monto;
      const convenio = row.convenio || row.lista || row.nombre_lista || row.convenios;
      const rubro = row.rubro_descrip || row.rubro || row.category || 'Varios';
      const subrubro = row.subrubro_descrip || row.subrubro || 'Varios';
      // precio1 = precio base único por producto (el "Mayorista"); porcentaje = markup de
      // esta lista sobre ese base. Ambos son opcionales — si el archivo no los trae (ej. un
      // Excel viejo con solo precio final), quedan en null y no se toca lo ya guardado.
      const precio1 = row.precio1 || row.preciobase || row.precio_base;
      const porcentaje = row.porcentaje;

      if (codigo && descrip && preciofinal && convenio) {
        parsedRows.push({
          sku: String(codigo).trim(),
          name: String(descrip).trim(),
          category: String(rubro).trim(),
          subcategory: String(subrubro).trim(),
          convenio: String(convenio).trim(),
          price: parseFloat(preciofinal),
          basePrice: precio1 !== undefined && precio1 !== null && precio1 !== '' ? parseFloat(precio1) : null,
          markupPercent: porcentaje !== undefined && porcentaje !== null && porcentaje !== '' ? parseFloat(porcentaje) : null,
        });
      }
    }

    // 2. Deduplicar (si el archivo repite un mismo SKU/convenio, se queda con la última
    // aparición — mismo comportamiento efectivo que el loop secuencial de antes)
    const productsBySku = new Map<string, ParsedRow>();
    const pricesByKey = new Map<string, ParsedRow>();
    for (const row of parsedRows) {
      productsBySku.set(row.sku, row);
      pricesByKey.set(`${row.sku}||${row.convenio}`, row);
    }
    const uniqueProducts = [...productsBySku.values()];
    const uniquePrices = [...pricesByKey.values()];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 3. Precio anterior de cada (sku, convenio) — una sola consulta por lote, no una por fila
      const oldPriceMap = new Map<string, number | null>();
      for (let i = 0; i < uniquePrices.length; i += BATCH_SIZE) {
        const chunk = uniquePrices.slice(i, i + BATCH_SIZE);
        const existing = await client.query(
          `SELECT pp.product_sku, pp.convenio, pp.precio
           FROM product_prices pp
           JOIN (SELECT unnest($1::text[]) AS sku, unnest($2::text[]) AS convenio) k
             ON pp.product_sku = k.sku AND pp.convenio = k.convenio`,
          [chunk.map(r => r.sku), chunk.map(r => r.convenio)]
        );
        for (const row of existing.rows) {
          oldPriceMap.set(`${row.product_sku}||${row.convenio}`, parseFloat(row.precio));
        }
      }

      for (let i = 0; i < uniqueProducts.length; i += BATCH_SIZE) {
        const chunk = uniqueProducts.slice(i, i + BATCH_SIZE);
        await client.query(
          `INSERT INTO products (sku, name, category, subcategory, stock, base_price)
           SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::int[], $6::numeric[])
           ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, subcategory = EXCLUDED.subcategory,
             base_price = COALESCE(EXCLUDED.base_price, products.base_price)`,
          [chunk.map(r => r.sku), chunk.map(r => r.name), chunk.map(r => r.category), chunk.map(r => r.subcategory), chunk.map(() => 100), chunk.map(r => r.basePrice)]
        );
      }

      let processed = 0;
      const changedBy = (req as any).user?.email || 'Sistema (Excel)';
      for (let i = 0; i < uniquePrices.length; i += BATCH_SIZE) {
        const chunk = uniquePrices.slice(i, i + BATCH_SIZE);
        await client.query(
          `INSERT INTO product_prices (product_sku, convenio, precio, markup_percent)
           SELECT * FROM unnest($1::text[], $2::text[], $3::numeric[], $4::numeric[])
           ON CONFLICT (product_sku, convenio) DO UPDATE SET precio = EXCLUDED.precio,
             markup_percent = COALESCE(EXCLUDED.markup_percent, product_prices.markup_percent)`,
          [chunk.map(r => r.sku), chunk.map(r => r.convenio), chunk.map(r => r.price), chunk.map(r => r.markupPercent)]
        );

        // Historial solo para los que realmente cambiaron de precio
        const changed = chunk.filter(r => oldPriceMap.get(`${r.sku}||${r.convenio}`) !== r.price);
        if (changed.length > 0) {
          await client.query(
            `INSERT INTO price_history (product_sku, convenio, old_price, new_price, changed_by)
             SELECT * FROM unnest($1::text[], $2::text[], $3::numeric[], $4::numeric[], $5::text[])`,
            [
              changed.map(r => r.sku),
              changed.map(r => r.convenio),
              changed.map(r => oldPriceMap.get(`${r.sku}||${r.convenio}`) ?? null),
              changed.map(r => r.price),
              changed.map(() => changedBy),
            ]
          );
        }
        processed += chunk.length;
      }

      await client.query('COMMIT');
      res.json({ message: `Sincronización masiva exitosa. ${processed} registros procesados.` });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error en carga masiva:', err);
      res.status(500).json({ error: 'Error en inyección masiva' });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(400).json({ error: 'Formato de Excel inválido.' });
  }
};

// 3. Crear/Editar un producto individual (Ahora guarda in_slider, package_size, is_new e image_url)
export const upsertIndividualProduct = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Denegado' });
  const { sku, name, category, subcategory, is_active, is_promo, promo_price, in_slider, package_size, is_new, image_url } = req.body;

  try {
    await pool.query(`
      INSERT INTO products (sku, name, category, subcategory, is_active, is_promo, promo_price, in_slider, package_size, is_new, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (sku) DO UPDATE
      SET name = $2, category = $3, subcategory = $4, is_active = $5, is_promo = $6, promo_price = $7, in_slider = $8, package_size = $9, is_new = $10, image_url = $11
    `, [sku, name, category, subcategory, is_active ?? true, is_promo ?? false, promo_price ?? 0, in_slider ?? false, package_size || null, is_new ?? false, image_url || null]);

    res.json({ message: 'Producto guardado con éxito' });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando producto' });
  }
};

// 4. Cambiar estado rápido
export const toggleProductFlags = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Denegado' });
  const { sku } = req.params;
  const { is_active, is_promo, promo_price } = req.body; 

  try {
    const updates = [];
    const values = [];
    let counter = 1;

    if (is_active !== undefined) { updates.push(`is_active = $${counter++}`); values.push(is_active); }
    if (is_promo !== undefined) { updates.push(`is_promo = $${counter++}`); values.push(is_promo); }
    if (promo_price !== undefined) { updates.push(`promo_price = $${counter++}`); values.push(promo_price); }

    if (updates.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });

    values.push(sku);
    await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE sku = $${counter}`, values);
    
    res.json({ message: 'Estado actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando estado' });
  }
};

// 5. Asignar precio manual a un convenio específico 
export const setIndividualPrice = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Denegado' });
  const { sku, convenio, precio } = req.body;

  try {
    await pool.query(`
      INSERT INTO product_prices (product_sku, convenio, precio)
      VALUES ($1, $2, $3)
      ON CONFLICT (product_sku, convenio) DO UPDATE 
      SET precio = $3
    `, [sku, convenio, precio]);
    res.json({ message: 'Precio individual actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando precio' });
  }
};

// 6. Obtener TODOS los productos para la tabla del Admin (Incluye in_slider)
// Con ?convenio=X además trae precio base, markup y precio final de esa lista puntual,
// para la pantalla "Listas de Precios".
export const getAdminProducts = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Denegado' });
  const convenio = (req.query.convenio as string || '').trim();
  try {
    if (convenio) {
      const result = await pool.query(`
        SELECT p.sku, p.name, p.category, p.is_active, p.is_promo, p.promo_price, p.in_slider,
               p.package_size, p.is_new, p.image_url, p.base_price, pp.markup_percent, pp.precio
        FROM products p
        INNER JOIN product_prices pp ON p.sku = pp.product_sku AND UPPER(TRIM(pp.convenio)) = UPPER(TRIM($1))
        ORDER BY p.name ASC
      `, [convenio]);
      return res.json(result.rows);
    }

    const result = await pool.query(`
      SELECT sku, name, category, is_active, is_promo, promo_price, in_slider, package_size, is_new, image_url, base_price
      FROM products
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo catálogo admin' });
  }
};

// 6b. Listas de precios existentes (convenios) con cuántos productos tiene cada una
export const getPriceLists = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Denegado' });
  try {
    const result = await pool.query(`
      SELECT convenio, COUNT(*) AS total_productos
      FROM product_prices
      GROUP BY convenio
      ORDER BY convenio ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo listas de precios' });
  }
};

// 6c. Editar el precio base (Mayorista) de un producto — recalcula el precio final de
// todas las listas que tienen markup guardado para ese sku.
export const updateBasePrice = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Denegado' });
  const { sku, base_price } = req.body;
  if (!sku || base_price === undefined || base_price === null || isNaN(parseFloat(base_price))) {
    return res.status(400).json({ error: 'sku y base_price son requeridos' });
  }
  const newBase = parseFloat(base_price);
  const changedBy = (req as any).user?.email || 'Admin';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE products SET base_price = $1 WHERE sku = $2', [newBase, sku]);

    const rows = await client.query(
      `SELECT convenio, precio, markup_percent FROM product_prices WHERE product_sku = $1 AND markup_percent IS NOT NULL`,
      [sku]
    );

    for (const row of rows.rows) {
      const oldPrice = parseFloat(row.precio);
      const newPrice = Math.round(newBase * (1 - parseFloat(row.markup_percent) / 100) * 100) / 100;
      if (newPrice === oldPrice) continue;
      await client.query('UPDATE product_prices SET precio = $1 WHERE product_sku = $2 AND convenio = $3', [newPrice, sku, row.convenio]);
      await client.query(
        `INSERT INTO price_history (product_sku, convenio, old_price, new_price, changed_by) VALUES ($1, $2, $3, $4, $5)`,
        [sku, row.convenio, oldPrice, newPrice, changedBy]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Precio base actualizado. Las listas con markup definido se recalcularon.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Error actualizando el precio base' });
  } finally {
    client.release();
  }
};

// 6d. Editar el markup de un producto en una lista puntual — recalcula el precio final
// desde el precio base del producto.
export const updateMarkup = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Denegado' });
  const { sku, convenio, markup_percent } = req.body;
  if (!sku || !convenio || markup_percent === undefined || markup_percent === null || isNaN(parseFloat(markup_percent))) {
    return res.status(400).json({ error: 'sku, convenio y markup_percent son requeridos' });
  }
  const newMarkup = parseFloat(markup_percent);
  const changedBy = (req as any).user?.email || 'Admin';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const productResult = await client.query('SELECT base_price FROM products WHERE sku = $1', [sku]);
    const basePrice = productResult.rows[0]?.base_price !== null && productResult.rows[0]?.base_price !== undefined
      ? parseFloat(productResult.rows[0].base_price) : null;
    if (basePrice === null) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Este producto todavía no tiene un precio base definido.' });
    }

    const priceResult = await client.query('SELECT precio FROM product_prices WHERE product_sku = $1 AND convenio = $2', [sku, convenio]);
    const oldPrice = priceResult.rows[0] ? parseFloat(priceResult.rows[0].precio) : null;
    const newPrice = Math.round(basePrice * (1 - newMarkup / 100) * 100) / 100;

    await client.query(`
      INSERT INTO product_prices (product_sku, convenio, precio, markup_percent)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (product_sku, convenio) DO UPDATE SET precio = $3, markup_percent = $4
    `, [sku, convenio, newPrice, newMarkup]);

    if (oldPrice !== newPrice) {
      await client.query(
        `INSERT INTO price_history (product_sku, convenio, old_price, new_price, changed_by) VALUES ($1, $2, $3, $4, $5)`,
        [sku, convenio, oldPrice, newPrice, changedBy]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Markup actualizado', precio: newPrice });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Error actualizando el markup' });
  } finally {
    client.release();
  }
};

// 7. Eliminar producto de raíz 
export const deleteProduct = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Denegado' });
  const { sku } = req.params;
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM product_prices WHERE product_sku = $1', [sku]);
      await client.query('DELETE FROM products WHERE sku = $1', [sku]);
      await client.query('COMMIT');
      res.json({ message: 'Producto eliminado correctamente' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el producto' });
    }
    };

// 9. Favoritos ("Mis habituales") — recompra rápida para clientes logueados
export const getFavorites = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  try {
    const result = await pool.query('SELECT product_sku FROM favorite_products WHERE user_id = $1', [userId]);
    res.json(result.rows.map(r => r.product_sku));
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo favoritos' });
  }
};

export const toggleFavorite = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  const { sku } = req.params;
  try {
    const existing = await pool.query('SELECT 1 FROM favorite_products WHERE user_id = $1 AND product_sku = $2', [userId, sku]);
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM favorite_products WHERE user_id = $1 AND product_sku = $2', [userId, sku]);
      return res.json({ favorite: false });
    }
    await pool.query('INSERT INTO favorite_products (user_id, product_sku) VALUES ($1, $2)', [userId, sku]);
    res.json({ favorite: true });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando favorito' });
  }
};

// 8. Historial de auditoría de precios
export const getPriceHistory = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Denegado' });
  const { sku } = req.params;
  try {
    const result = await pool.query(`
      SELECT * FROM price_history 
      WHERE product_sku = $1 
      ORDER BY changed_at DESC
    `, [sku]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo historial de precios' });
  }
};