import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as XLSX from 'xlsx';
import { pool } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'sul_secreto_super_seguro_2026';

// 1. Login con bandera de cambio de contraseña obligatorio
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    if (!user.is_active) return res.status(403).json({ error: 'Cuenta suspendida temporalmente. Contacte a logística.' });

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '8h' });

    res.status(200).json({
      token,
      user: { 
        email: user.email, 
        role: user.role, 
        convenio: user.convenio_asignado,
        name: user.name,
        requirePasswordChange: user.require_password_change // Corregido: Comentario JS válido
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en servidor' });
  }
};

// 2. Ruta para que el cliente actualice su clave temporal la primera vez
export const changePassword = async (req: Request, res: Response) => {
  const { newPassword } = req.body;
  const userId = req.user?.id;

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

// 3. 🚀 INYECTOR MASIVO DE CLIENTES DESDE EXCEL (.XLS / .XLSX)
export const uploadClientsExcel = async (req: Request, res: Response) => {
  if (req.user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });
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
          
          const convenio = row.nombre_lista ? String(row.nombre_lista).trim() : '2x1 Cordoba';
          const isActive = parseInt(row.inactivo) === 0;
          const vendedor = row.nombre_vendedor ? `Vendedor: ${row.nombre_vendedor}` : 'Sin vendedor';

          await client.query(`
            INSERT INTO users (client_code, name, email, password, role, convenio_asignado, is_active, require_password_change, observaciones)
            VALUES ($1, $2, $3, $4, 'Cliente', $5, $6, TRUE, $7)
            ON CONFLICT (client_code) DO UPDATE 
            SET name = $2, convenio_asignado = $5, is_active = $6, observaciones = $7
          `, [cleanCode, cleanName, generatedEmail, defaultPasswordHash, convenio, isActive, vendedor]);

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

export const registerMinorista = async (req: Request, res: Response) => {
  const { email, password, telefono, domicilio_facturacion } = req.body;
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    
    await pool.query(`
      INSERT INTO users (email, password, role, convenio_asignado, telefono, domicilio_facturacion, lugar_entrega, require_password_change)
      VALUES ($1, $2, 'Minorista', '2x1 Cordoba', $3, $4, $4, FALSE)
    `, [email, hash, telefono, domicilio_facturacion]);

    res.status(201).json({ message: 'Registro exitoso asignado a Red Córdoba' });
  } catch (err) {
    res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado' });
  }
};

export const adminCreateUser = async (req: Request, res: Response) => {
  if (req.user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });
  const { email, password, role, convenio_asignado, telefono, domicilio_facturacion, lugar_entrega, dias_entrega_permitidos, observaciones } = req.body;
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // Corregido: Se eliminó el "suicide" fantasma
    await pool.query(`
      INSERT INTO users (email, password, role, convenio_asignado, telefono, domicilio_facturacion, lugar_entrega, dias_entrega_permitidos, observaciones, require_password_change)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE)
    `, [email, hash, role, convenio_asignado, telefono, domicilio_facturacion, lugar_entrega, JSON.stringify(dias_entrega_permitidos), observaciones]);

    res.status(201).json({ message: 'Cliente dado de alta de forma manual' });
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar alta de cliente' });
  }
};