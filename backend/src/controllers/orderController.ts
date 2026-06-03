import { Request, Response } from 'express';
import { pool } from '../config/db';
import { sendOrderEmail } from '../utils/mailer';

export const createOrder = async (req: Request, res: Response) => {
  const { 
    userId, 
    customerName, 
    customerEmail, 
    customerPhone, 
    deliveryAddress, 
    deliveryType, 
    deliveryDate, 
    paymentMethod, 
    totalAmount, 
    observations, 
    items 
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

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
      userId || null, customerName, customerEmail || null, customerPhone || null,
      deliveryAddress || null, deliveryType, deliveryDate || null,
      paymentMethod, totalAmount, observations || null
    ]);
    const orderId = orderResult.rows[0].id;

    // 2. Insertar los items del pedido
    for (const item of items) {
      const itemQuery = `
        INSERT INTO order_items (
          order_id, product_sku, product_name, quantity, unit_price, subtotal
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(itemQuery, [
        orderId, 
        item.product.sku, 
        item.product.name, 
        item.quantity, 
        item.product.isPromo ? item.product.promoPrice : item.product.unitPrice,
        (item.product.isPromo ? item.product.promoPrice : item.product.unitPrice) * item.quantity
      ]);
    }

    await client.query('COMMIT');

    // 🚀 ENVÍO DE EMAIL (No bloquea la respuesta al cliente)
    sendOrderEmail(req.body, items).catch(err => console.error('Error enviando mail de pedido:', err));

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
      SELECT DISTINCT o.* 
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
  const { id } = req.params;
  try {
    const orderItems = await pool.query(`SELECT * FROM order_items WHERE order_id = $1`, [id]);
    res.json(orderItems.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo detalles del pedido' });
  }
};
