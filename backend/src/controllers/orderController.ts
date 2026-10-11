import { Request, Response } from 'express';
import { pool } from '../config/db';
import { sendOrderEmail } from '../utils/mailer';

export const createOrder = async (req: Request, res: Response) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    deliveryType,
    deliveryDate,
    paymentMethod,
    observations,
    items
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El pedido no tiene artículos.' });
  }

  // El precio y el total NUNCA se toman del cliente: se recalculan contra la
  // lista de precios real del convenio del usuario (o CORDOBA para invitados,
  // la misma lista pública que usa getProductsByConvenio sin sesión).
  const userId = (req as any).user?.id ?? null;
  const convenio = (req as any).user?.convenio ?? 'CORDOBA';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const skus = items.map((item: any) => item.product?.sku).filter(Boolean);
    const priceLookup = await client.query(
      `SELECT p.sku, p.name, p.is_promo, p.promo_price, pr.precio
       FROM products p
       INNER JOIN product_prices pr ON p.sku = pr.product_sku
       WHERE p.sku = ANY($1) AND UPPER(TRIM(pr.convenio)) = UPPER(TRIM($2)) AND p.is_active = TRUE`,
      [skus, convenio]
    );

    const priceBySku: Record<string, { name: string; unitPrice: number }> = {};
    for (const row of priceLookup.rows) {
      priceBySku[row.sku] = {
        name: row.name,
        unitPrice: row.is_promo ? parseFloat(row.promo_price) : parseFloat(row.precio),
      };
    }

    const missingSkus = skus.filter((sku: string) => !priceBySku[sku]);
    if (missingSkus.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Estos productos ya no están disponibles en tu lista de precios: ${missingSkus.join(', ')}` });
    }

    const resolvedItems = items.map((item: any) => {
      const real = priceBySku[item.product.sku];
      const quantity = Number(item.quantity) || 0;
      return { sku: item.product.sku, name: real.name, quantity, unitPrice: real.unitPrice, subtotal: real.unitPrice * quantity };
    });
    const totalAmount = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);

    // 1. Insertar la cabecera del pedido
    const orderQuery = `
      INSERT INTO orders (
        user_id, customer_name, customer_email, customer_phone,
        delivery_address, delivery_type, delivery_date,
        payment_method, total_amount, observations
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;
    const orderResult = await client.query(orderQuery, [
      userId, customerName, customerEmail || null, customerPhone || null,
      deliveryAddress || null, deliveryType, deliveryDate || null,
      paymentMethod, totalAmount, observations || null
    ]);
    const orderId = orderResult.rows[0].id;

    // 2. Insertar los items del pedido (con el precio recalculado del servidor)
    for (const item of resolvedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_sku, product_name, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.sku, item.name, item.quantity, item.unitPrice, item.subtotal]
      );
    }

    await client.query('COMMIT');

    // 🚀 ENVÍO DE EMAIL (No bloquea la respuesta al cliente) — con los datos reales, no los del cliente
    const emailItems = resolvedItems.map(i => ({ product: { name: i.name, isPromo: false, unitPrice: i.unitPrice }, quantity: i.quantity }));
    sendOrderEmail({ customerName, customerEmail, customerPhone, deliveryAddress, deliveryType, deliveryDate, paymentMethod, observations, totalAmount }, emailItems)
      .catch(err => console.error('Error enviando mail de pedido:', err));

    res.status(201).json({ message: 'Pedido guardado con éxito', orderId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creando pedido:', err);
    res.status(500).json({ error: 'Error interno al procesar el pedido' });
  } finally {
    client.release();
  }
};

export const getOrders = async (req: Request, res: Response) => {
  if (!(req as any).user) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const { role, id: userId } = (req as any).user;
  const { customer, startDate, endDate, product, status } = req.query;

  try {
    let query = `
      SELECT DISTINCT o.*,
        (SELECT COUNT(*) FROM order_items oi2 WHERE oi2.order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (role !== 'Admin') {
      query += ` AND o.user_id = $${paramIndex++}`;
      params.push(userId);
    }

    if (customer) {
      query += ` AND (o.customer_name ILIKE $${paramIndex} OR o.customer_email ILIKE $${paramIndex})`;
      params.push(`%${customer}%`);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND o.created_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND o.created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    if (product) {
      query += ` AND (oi.product_name ILIKE $${paramIndex} OR oi.product_sku ILIKE $${paramIndex})`;
      params.push(`%${product}%`);
      paramIndex++;
    }

    if (status) {
      query += ` AND o.status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error filtrando pedidos:', err);
    res.status(500).json({ error: 'Error obteniendo pedidos' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Estado del pedido actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando estado' });
  }
};

export const getOrderDetails = async (req: Request, res: Response) => {
  if (!(req as any).user) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const { role, id: requesterId } = (req as any).user;
  const { id } = req.params;
  try {
    const order = await pool.query(`SELECT user_id FROM orders WHERE id = $1`, [id]);
    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (role !== 'Admin' && order.rows[0].user_id !== requesterId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const orderItems = await pool.query(`SELECT * FROM order_items WHERE order_id = $1`, [id]);
    res.json(orderItems.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo detalles del pedido' });
  }
};

// 4. Estadísticas profesionales para el Dashboard (Business Intelligence)
export const getDashboardStats = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Denegado' });

  const { startDate, endDate, granularity = 'day' } = req.query;

  try {
    let dateTrunc = 'day';
    if (granularity === 'week') dateTrunc = 'week';
    if (granularity === 'month') dateTrunc = 'month';

    // A. Ventas por período
    let salesQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC($1, created_at), 
          CASE 
            WHEN $1 = 'day' THEN 'DD/MM'
            WHEN $1 = 'week' THEN '\"Sem \"WW'
            WHEN $1 = 'month' THEN 'Month'
            ELSE 'DD/MM'
          END
        ) as label,
        COALESCE(SUM(total_amount), 0) as total,
        COUNT(*) as orders
      FROM orders
      WHERE 1=1
    `;
    const salesParams: any[] = [dateTrunc];
    
    if (startDate && endDate) {
      // El límite superior se trata como "hasta el final de ese día" — si no, al ser
      // una fecha sin hora (medianoche) quedan afuera todos los pedidos del día elegido.
      salesQuery += ' AND created_at >= $2 AND created_at < ($3::date + INTERVAL \'1 day\')';
      salesParams.push(startDate, endDate);
    } else {
      salesQuery += ' AND created_at >= CURRENT_DATE - INTERVAL \'30 days\' AND created_at < (CURRENT_DATE + INTERVAL \'1 day\')';
    }

    salesQuery += ' GROUP BY DATE_TRUNC($1, created_at) ORDER BY DATE_TRUNC($1, created_at) ASC';
    const salesOverTime = await pool.query(salesQuery, salesParams);

    // B. Top 5 Productos — respeta el mismo rango de fechas que el resto del dashboard
    // (antes siempre mostraba el histórico completo, ignorando el filtro elegido en la UI)
    let topProductsQuery = `
      SELECT oi.product_name as name, SUM(oi.quantity) as value
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE 1=1
    `;
    const topProductsParams: any[] = [];
    if (startDate && endDate) {
      topProductsQuery += ' AND o.created_at >= $1 AND o.created_at < ($2::date + INTERVAL \'1 day\')';
      topProductsParams.push(startDate, endDate);
    } else {
      topProductsQuery += ' AND o.created_at >= CURRENT_DATE - INTERVAL \'30 days\' AND o.created_at < (CURRENT_DATE + INTERVAL \'1 day\')';
    }
    topProductsQuery += ' GROUP BY oi.product_name ORDER BY value DESC LIMIT 5';
    const topProducts = await pool.query(topProductsQuery, topProductsParams);

    // C. Comparativa de Listas (Convenios)
    let listQuery = `
      SELECT u.convenio, COALESCE(SUM(o.total_amount), 0) as total, COUNT(o.id) as orders
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const listParams: any[] = [];
    if (startDate && endDate) {
      listQuery += ' AND o.created_at >= $1 AND o.created_at < ($2::date + INTERVAL \'1 day\')';
      listParams.push(startDate, endDate);
    } else {
      listQuery += ' AND o.created_at >= CURRENT_DATE - INTERVAL \'30 days\' AND o.created_at < (CURRENT_DATE + INTERVAL \'1 day\')';
    }
    listQuery += ' GROUP BY u.convenio ORDER BY total DESC';
    const listComparison = await pool.query(listQuery, listParams);

    // D. Mejores Clientes — mismo rango de fechas que el resto (antes ignoraba el filtro)
    let topClientsQuery = `
      SELECT customer_name as name, COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE 1=1
    `;
    const topClientsParams: any[] = [];
    if (startDate && endDate) {
      topClientsQuery += ' AND created_at >= $1 AND created_at < ($2::date + INTERVAL \'1 day\')';
      topClientsParams.push(startDate, endDate);
    } else {
      topClientsQuery += ' AND created_at >= CURRENT_DATE - INTERVAL \'30 days\' AND created_at < (CURRENT_DATE + INTERVAL \'1 day\')';
    }
    topClientsQuery += ' GROUP BY customer_name ORDER BY total DESC LIMIT 5';
    const topClients = await pool.query(topClientsQuery, topClientsParams);

    // E. Resumen General
    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        (SELECT COUNT(*) FROM users WHERE role = 'Cliente') as total_clients
      FROM orders
    `);

    res.json({
      salesOverTime: salesOverTime.rows,
      topProducts: topProducts.rows,
      listComparison: listComparison.rows,
      topClients: topClients.rows,
      summary: summary.rows[0]
    });
  } catch (err) {
    console.error('🚨 Error en getDashboardStats:', err);
    res.status(500).json({ error: 'Error interno al generar analítica' });
  }
};
