import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as XLSX from 'xlsx';
import { pool } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'sul_secreto_super_seguro_2026';

// 1. Login unificado con control de estado activo
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    // Bloqueo inmediato si el cliente está desactivado por lógica
    if (user.is_active === false) {
      return res.status(403).json({ error: 'Cuenta suspendida temporalmente. Contacte a logística de SUL.' });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        email: user.email,
        convenio: user.convenio 
      }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );

    res.status(200).json({
      token,
      user: { 
        email: user.email, 
        role: user.role, 
        convenio: user.convenio,
        name: user.name,
        requirePasswordChange: user.require_password_change 
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en servidor' });
  }
};

// 2. Ruta para cambiar contraseña temporal en el primer ingreso
export const changePassword = async (req: Request, res: Response) => {
  const { newPassword } = req.body;
  const userId = (req as any).user?.id; 

  if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });

  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);

    await pool.query(`
      UPDATE users 
      SET password = $1, require_password_change = FALSE 
      WHERE id = $2
    `, [hash, userId]);

    res.json({ message: 'Contraseña actualizada correctamente. ¡Ya podés operar!' });
  } catch (err) {
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};

// 3. Alta Individual de Cliente desde el Formulario del Panel Admin
export const registerClientAdmin = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });

  const {
    tradeName, businessName, taxId, address, city, 
    province, phone, email, seller, agreement, group
  } = req.body;

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe una cuenta vinculada a este email.' });
    }

    const currentYear = new Date().getFullYear();
    const genericPassword = `SUL${currentYear}!`;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(genericPassword, salt);

    await pool.query(
      `INSERT INTO users (
        name, email, password, role, convenio, domicilio_facturacion, 
        razon_social, cuit, localidad, provincia, telefono, vendedor, grupo, require_password_change, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, TRUE)`,
      [
        tradeName, 
        email, 
        hashedPassword, 
        'Cliente', 
        agreement, 
        address, 
        businessName || null, 
        taxId || null, 
        city, 
        province, 
        phone, 
        seller, 
        group,
        true 
      ]
    );

    res.status(201).json({ 
      message: 'Cliente creado exitosamente. Contraseña temporal generada.'
    });

  } catch (error) {
    console.error('Error al registrar cliente desde admin:', error);
    res.status(500).json({ error: 'Error interno al crear el cliente.' });
  }
};

// 4. Inyector masivo desde Excel alineado a la nueva tabla de Neon
export const uploadClientsExcel = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });
  if (!req.file) return res.status(400).json({ error: 'Archivo de clientes ausente' });

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('SULcongelados2026', salt);

    const client = await pool.connect();
    let processed = 0;

    try {
      await client.query('BEGIN');

      for (const row of rows) {
        if (row.cl_codigo && row.cl_nombre) {
          const cleanCode = String(row.cl_codigo).split('.')[0].trim();
          const cleanName = String(row.cl_nombre).trim();
          const generatedEmail = `cl_${cleanCode}@sul.com`.toLowerCase();
          
          const convenio = row.nombre_lista ? String(row.nombre_lista).trim() : 'GENERAL';
          const vendedor = row.nombre_vendedor ? String(row.nombre_vendedor).trim() : 'Sin vendedor';

          await pool.query(`
            INSERT INTO users (name, email, password, role, convenio, vendedor, require_password_change, is_active)
            VALUES ($1, $2, $3, 'Cliente', $4, $5, TRUE, TRUE)
            ON CONFLICT (email) DO UPDATE 
            SET name = $1, convenio = $4, vendedor = $5, is_active = TRUE
          `, [cleanName, generatedEmail, defaultPasswordHash, convenio, vendedor]);

          processed++;
        }
      }

      await client.query('COMMIT');
      res.json({ message: `Sincronización logística exitosa. Se procesaron ${processed} clientes en la base central.` });
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error("Error inyectando cliente:", err.message);
      res.status(500).json({ error: 'Error interno procesando las filas del Excel' });
    } finally {
      client.release();
    }
  } catch (globalErr: any) {
    res.status(400).json({ error: 'El archivo provisto no contiene una estructura válida de Excel.' });
  }
};

// 5. Registro manual simplificado para minoristas
export const registerMinorista = async (req: Request, res: Response) => {
  const { email, password, telefono, domicilio_facturacion } = req.body;
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    
    await pool.query(`
      INSERT INTO users (email, password, role, convenio, telefono, domicilio_facturacion, require_password_change, is_active)
      VALUES ($1, $2, 'Minorista', 'GENERAL', $3, $4, FALSE, TRUE)
    `, [email, hash, telefono, domicilio_facturacion]);

    res.status(201).json({ message: 'Registro exitoso asignado a Red General' });
  } catch (err) {
    res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado' });
  }
};

// 6. Creación genérica de usuarios por Administrador
export const adminCreateUser = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });
  const { email, password, role, convenio, telefono, domicilio_facturacion, vendedor, grupo } = req.body;
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    await pool.query(`
      INSERT INTO users (email, password, role, convenio, telefono, domicilio_facturacion, vendedor, grupo, require_password_change, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, TRUE)
    `, [email, hash, role, convenio, telefono, domicilio_facturacion, vendedor, grupo]);

    res.status(201).json({ message: 'Usuario dado de alta de forma manual' });
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar alta de usuario' });
  }
};

// 7. Listado CRM de clientes (Trae también el estado is_active)
export const getClients = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const result = await pool.query(`
      SELECT id, name, email, convenio, razon_social, cuit, localidad, provincia, telefono, vendedor, grupo, is_active 
      FROM users 
      WHERE role = 'Cliente' 
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener clientes:', err);
    res.status(500).json({ error: 'Error interno del servidor al obtener el listado de clientes.' });
  }
};

// 8. 🚀 NUEVO: Baja lógica de clientes (Desactivación en vez de eliminación física)
export const deleteClientAdmin = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });
  const { id } = req.params;
  try {
    await pool.query("UPDATE users SET is_active = FALSE WHERE id = $1 AND role = 'Cliente'", [id]);
    res.json({ message: 'Cliente suspendido comercialmente con éxito.' });
  } catch (err) {
    console.error('Error al desactivar cliente:', err);
    res.status(500).json({ error: 'Error al cambiar estado del cliente.' });
  }
};