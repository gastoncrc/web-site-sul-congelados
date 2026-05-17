import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'sul_secreto_super_seguro_2026';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user || !user.is_active) return res.status(401).json({ error: 'Credenciales inválidas o cuenta inactiva' });

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '8h' });

    res.status(200).json({
      token,
      user: { email: user.email, role: user.role, convenio: user.convenio_asignado }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en servidor' });
  }
};

// Formulario normal de la web para minoristas autónomos
export const registerMinorista = async (req: Request, res: Response) => {
  const { email, password, telefono, domicilio_facturacion } = req.body;
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    
    // Vinculación ciega automática al convenio base: 2x1 Cordoba
    await pool.query(`
      INSERT INTO users (email, password, role, convenio_asignado, telefono, domicilio_facturacion, lugar_entrega)
      VALUES ($1, $2, 'Minorista', '2x1 Cordoba', $3, $4, $4)
    `, [email, hash, telefono, domicilio_facturacion]);

    res.status(201).json({ message: 'Registro exitoso asignado a Red Córdoba' });
  } catch (err) {
    res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado' });
  }
};

// Panel Admin: Creación manual y control absoluto de clientes B2B
export const adminCreateUser = async (req: Request, res: Response) => {
  if (req.user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });

  const { 
    email, password, role, convenio_asignado, telefono, 
    domicilio_facturacion, lugar_entrega, dias_entrega_permitidos, observaciones 
  } = req.body;

  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    await pool.query(`
      INSERT INTO users (email, password, role, convenio_asignado, telefono, domicilio_facturacion, lugar_entrega, dias_entrega_permitidos, observaciones)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [email, hash, role, convenio_asignado, telefono, domicilio_facturacion, lugar_entrega, JSON.stringify(dias_entrega_permitidos), observaciones]);

    res.status(201).json({ message: 'Cliente corporativo dado de alta con éxito' });
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar alta de cliente corporativo' });
  }
};