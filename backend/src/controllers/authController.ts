import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as XLSX from 'xlsx';
import { pool } from '../config/db';
import { sendPasswordResetEmail } from '../utils/mailer';
import { JWT_SECRET } from '../config/jwt';
const MIN_PASSWORD_LENGTH = 8;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

const getFrontendUrl = (): string => {
  const configured = process.env.FRONTEND_URL?.split(',')[0]?.trim();
  return configured || 'https://sulcongelados.com';
};

// 1. Login unificado con control de estado activo
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    if (user.is_active === false) {
      return res.status(403).json({ error: 'Cuenta suspendida temporalmente. Contacte a logística de SUL.' });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, convenio: user.convenio }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );

    res.status(200).json({
      token,
      user: { email: user.email, role: user.role, convenio: user.convenio, name: user.name, requirePasswordChange: user.require_password_change, diasEntrega: user.dias_entrega }
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

    await pool.query(`UPDATE users SET password = $1, require_password_change = FALSE WHERE id = $2`, [hash, userId]);
    res.json({ message: 'Contraseña actualizada correctamente. ¡Ya podés operar!' });
  } catch (err) {
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};

// 3. Alta Individual de Cliente desde el Formulario del Panel Admin (Intacto, como lo pasaste)
export const registerClientAdmin = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });

  const { tradeName, businessName, taxId, address, city, province, phone, email, seller, agreement, group } = req.body;

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ error: 'Ya existe una cuenta vinculada a este email.' });

    const currentYear = new Date().getFullYear();
    const genericPassword = `SUL${currentYear}!`;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(genericPassword, salt);

    await pool.query(
      `INSERT INTO users (
        name, email, password, role, convenio, domicilio_facturacion, 
        razon_social, cuit, localidad, provincia, telefono, vendedor, grupo, require_password_change, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, TRUE)`,
      [tradeName, email, hashedPassword, 'Cliente', agreement, address, businessName || null, taxId || null, city, province, phone, seller, group, true]
    );

    res.status(201).json({ message: 'Cliente creado exitosamente. Contraseña temporal generada.' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al crear el cliente.' });
  }
};

// 4. Inyector masivo desde Excel alineado a la nueva tabla de Neon (Corregido 'Cliente' y campos del CSV)
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
          
          // Mapea si "inactivo" es 1, entonces is_active es false. Si no, es true.
          const is_active = (row.inactivo == 1 || row.inactivo == '1') ? false : true;

          // ON CONFLICT por client_code (el código del ERP, estable) — no por email: si el
          // admin ya corrigió el email de este cliente a uno real desde el panel, matchear
          // por email volvería a generar el placeholder cl_<codigo>@sul.com y crearía un
          // cliente duplicado en vez de actualizar el real. Tampoco se toca email ni
          // password en el UPDATE — ambos quedan como estén, se hayan corregido o no.
          await client.query(`
            INSERT INTO users (name, email, password, role, convenio, vendedor, require_password_change, is_active, client_code)
            VALUES ($1, $2, $3, 'Cliente', $4, $5, TRUE, $6, $7)
            ON CONFLICT (client_code) DO UPDATE
            SET name = $1, convenio = $4, vendedor = $5, is_active = $6
          `, [cleanName, generatedEmail, defaultPasswordHash, convenio, vendedor, is_active, cleanCode]);

          processed++;
        }
      }

      await client.query('COMMIT');
      res.json({ message: `Sincronización logística exitosa. Se procesaron ${processed} clientes en la base central.` });
    } catch (err: any) {
      await client.query('ROLLBACK');
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
    const defaultConvenioResult = await pool.query("SELECT value FROM settings WHERE key = 'default_minorista_convenio'");
    const defaultConvenio = defaultConvenioResult.rows[0]?.value || 'Gastronomica';
    await pool.query(`INSERT INTO users (email, password, role, convenio, telefono, domicilio_facturacion, require_password_change, is_active) VALUES ($1, $2, 'Minorista', $3, $4, $5, FALSE, TRUE)`, [email, hash, defaultConvenio, telefono, domicilio_facturacion]);
    res.status(201).json({ message: 'Registro exitoso' });
  } catch (err) {
    res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado' });
  }
};

// 6. Creación genérica de usuarios por Administrador
export const adminCreateUser = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });
  const { email, password, role, telefono, domicilio_facturacion, vendedor, grupo } = req.body;
  let { convenio } = req.body;
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    if (!convenio) {
      const defaultConvenioResult = await pool.query("SELECT value FROM settings WHERE key = 'default_minorista_convenio'");
      convenio = defaultConvenioResult.rows[0]?.value || 'Gastronomica';
    }

    await pool.query(`
      INSERT INTO users (email, password, role, convenio, telefono, domicilio_facturacion, vendedor, grupo, require_password_change, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, TRUE)
    `, [email, hash, role, convenio, telefono, domicilio_facturacion, vendedor, grupo]);

    res.status(201).json({ message: 'Usuario dado de alta de forma manual' });
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar alta de usuario' });
  }
};

// 7. Listado CRM de cuentas (todos los roles — Admin, Cliente, Minorista, Vendedor)
export const getClients = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const result = await pool.query(`
      SELECT id, name, email, role, convenio, razon_social, cuit, localidad, provincia, telefono, vendedor, grupo, is_active
      FROM users
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor al obtener el listado de cuentas.' });
  }
};

// 8. Pausar / reactivar cualquier cuenta
export const setAccountStatus = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });
  const { id } = req.params;
  const { is_active } = req.body;
  if (typeof is_active !== 'boolean') return res.status(400).json({ error: 'is_active debe ser true o false' });
  try {
    const result = await pool.query('UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id', [is_active, id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Cuenta no encontrada' });
    res.json({ message: is_active ? 'Cuenta reactivada con éxito.' : 'Cuenta pausada con éxito.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al cambiar el estado de la cuenta.' });
  }
};

// 🚀 AGREGAR AL FINAL DE authController.ts

export const updateClient = async (req: any, res: any) => {
  if (req.user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const { id } = req.params;
    const {
      name, email, role, convenio, razon_social, cuit, localidad,
      provincia, telefono, vendedor, grupo,
      domicilio_facturacion, dias_entrega
    } = req.body;

    if (!email) return res.status(400).json({ error: 'El email no puede quedar vacío.' });

    const VALID_ROLES = ['Admin', 'Cliente', 'Minorista', 'Vendedor'];
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `Rol inválido. Tiene que ser uno de: ${VALID_ROLES.join(', ')}.` });
    }

    const conflict = await pool.query('SELECT id, name, role FROM users WHERE email = $1 AND id != $2', [email, id]);
    if (conflict.rows.length > 0) {
      const other = conflict.rows[0];
      return res.status(400).json({
        error: `Ese email ya lo usa otra cuenta: "${other.name || 'sin nombre'}" (${other.role}, id ${other.id}). Elegí uno distinto o corregí esa cuenta primero.`
      });
    }

    // Si se le está bajando el rol a un Admin, que no sea el último que queda —
    // si no, nadie podría volver a entrar al panel.
    const currentResult = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (currentResult.rows[0]?.role === 'Admin' && role !== 'Admin') {
      const adminCountResult = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'Admin' AND is_active = TRUE");
      if (parseInt(adminCountResult.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'No se puede quitar el rol Admin al único administrador activo que queda.' });
      }
    }

    // Asumiendo que tu tabla en la base de datos se llama 'users'
    const updateQuery = `
      UPDATE users
      SET
        name = $1, email = $2, role = $3, convenio = $4, razon_social = $5, cuit = $6,
        localidad = $7, provincia = $8, telefono = $9, vendedor = $10,
        grupo = $11, domicilio_facturacion = $12, dias_entrega = $13
      WHERE id = $14
      RETURNING *;
    `;

    const values = [
      name, email, role, convenio, razon_social, cuit, localidad,
      provincia, telefono, vendedor, grupo,
      domicilio_facturacion, dias_entrega, id
    ];

    // Ejecuta la consulta (si usás pool de pg)
    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ message: 'Datos actualizados correctamente', client: result.rows[0] });

  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe otra cuenta con ese email.' });
    }
    console.error('🚨 Error al actualizar el cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor al guardar los cambios' });
  }
};

// 9. Admin genera una contraseña aleatoria para una cuenta — se muestra una sola vez en la
// respuesta (nunca se persiste ni se loguea en texto plano) y fuerza cambio al primer ingreso.
export const generatePassword = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });
  const { id } = req.params;
  try {
    const plainPassword = crypto.randomBytes(9).toString('base64url');
    const hash = bcrypt.hashSync(plainPassword, bcrypt.genSaltSync(10));

    const result = await pool.query(
      'UPDATE users SET password = $1, require_password_change = TRUE WHERE id = $2 RETURNING id',
      [hash, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Cuenta no encontrada' });

    res.json({ message: 'Contraseña generada. Comunicásela al usuario ahora — no se volverá a mostrar.', password: plainPassword });
  } catch (err) {
    res.status(500).json({ error: 'Error al generar la contraseña' });
  }
};

// 10. Admin elige manualmente una contraseña para una cuenta — también fuerza cambio al
// primer ingreso.
export const setPassword = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });
  const { id } = req.params;
  const { password } = req.body;
  if (!password || String(password).length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` });
  }
  try {
    const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    const result = await pool.query(
      'UPDATE users SET password = $1, require_password_change = TRUE WHERE id = $2 RETURNING id',
      [hash, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Cuenta no encontrada' });

    res.json({ message: 'Contraseña actualizada. El usuario deberá cambiarla al ingresar.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar la contraseña' });
  }
};

// 11. Solicitud pública de recuperación de contraseña — siempre responde el mismo mensaje
// genérico, exista o no la cuenta, para no filtrar qué emails están registrados.
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const genericResponse = { message: 'Si el email está registrado, vas a recibir un enlace para restablecer tu contraseña.' };
  if (!email) return res.json(genericResponse);

  try {
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1 AND is_active = TRUE', [email]);
    const user = userResult.rows[0];
    if (!user) return res.json(genericResponse);

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    );

    const resetLink = `${getFrontendUrl()}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetLink);

    res.json(genericResponse);
  } catch (err) {
    console.error('🚨 Error en forgotPassword:', err);
    // Igual respondemos genérico — no delatamos errores internos a un endpoint público.
    res.json(genericResponse);
  }
};

// 12. Confirmación pública de recuperación — consume el token de un solo uso.
export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || String(newPassword).length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Token y contraseña (mínimo ${MIN_PASSWORD_LENGTH} caracteres) son requeridos.` });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const tokenResult = await pool.query(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );
    const resetToken = tokenResult.rows[0];
    if (!resetToken) return res.status(400).json({ error: 'El enlace venció o ya fue usado. Solicitá uno nuevo.' });

    const hash = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
    await pool.query('UPDATE users SET password = $1, require_password_change = FALSE WHERE id = $2', [hash, resetToken.user_id]);
    await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [resetToken.id]);

    res.json({ message: 'Contraseña actualizada. Ya podés iniciar sesión.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
};