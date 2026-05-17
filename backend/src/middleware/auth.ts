import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'sul_secreto_super_seguro_2026';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: 'Admin' | 'Mayorista' | 'Distribuidor' | 'Minorista';
        email: string;
        convenio: string;
      };
    }
  }
}

export const verifyTokenAndStatus = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  // Si no hay token, pasa como público (asumirá convenio Córdoba más adelante)
  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) return res.status(401).json({ error: 'Token inválido o expirado' });

    try {
      // Verificamos estado real e is_active directo en base de datos
      const userCheck = await pool.query('SELECT is_active, convenio_asignado FROM users WHERE id = $1', [decoded.id]);
      const dbUser = userCheck.rows[0];

      if (!dbUser) return res.status(404).json({ error: 'Usuario inexistente' });
      
      // Control de Riesgo: Si diste de baja al cliente, se le corta el acceso de inmediato
      if (!dbUser.is_active) {
        return res.status(403).json({ error: 'Cuenta suspendida temporalmente. Contacte a logística de SUL.' });
      }

      req.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
        convenio: dbUser.convenio_asignado
      };
      
      next();
    } catch (error) {
      res.status(500).json({ error: 'Error verificando estado de usuario' });
    }
  });
};