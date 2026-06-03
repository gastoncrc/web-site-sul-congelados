import { Request, Response } from 'express';
import { pool } from '../config/db';

export const getVendorClients = async (req: Request, res: Response) => {
const reqUser = (req as any).user;
if (!reqUser || (reqUser.role !== 'Vendedor' && reqUser.role !== 'Admin')) {
return res.status(403).json({ error: 'Acceso exclusivo para Vendedores o Administradores.' });
}
try {
// Si es Vendedor, puede filtrar opcionalmente por su propio nombre o ver todos los de la cartera general
let query = `SELECT id, client_code, name, email, convenio, telefono, domicilio_facturacion, lugar_entrega, dias_entrega, observaciones, razon_social, cuit, localidad, provincia, vendedor, grupo FROM users WHERE role = 'Cliente' AND is_active = TRUE`;

const params: any[] = [];
// Opcional: Filtrar estrictamente por el nombre del vendedor si está asignado en la DB
if (reqUser.role === 'Vendedor' && reqUser.name) {
  query += ` AND UPPER(TRIM(vendedor)) = UPPER(TRIM($1))`;
  params.push(reqUser.name);
}

query += ` ORDER BY razon_social ASC, name ASC`;
const result = await pool.query(query, params);
res.json(result.rows);
} catch (err: any) {
res.status(500).json({ error: 'Error al obtener cartera de clientes.' });
}
};