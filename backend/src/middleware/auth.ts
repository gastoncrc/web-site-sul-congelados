import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'sul_secreto_super_seguro_2026';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
        email: string;
        convenio: string;
      };
    }
  }
}

export const verifyTokenAndStatus = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) return res.status(401).json({ error: 'Token inválido o expirado' });

    try {
      // 🚀 ACÁ ESTÁ EL FIX: Solo buscamos las columnas nuevas que existen en Neon
      const userCheck = await pool.query('SELECT role, convenio FROM users WHERE id = $1', [decoded.id]);
      const dbUser = userCheck.rows[0];

      if (!dbUser) return res.status(404).json({ error: 'Usuario inexistente' });
      
      req.user = {
        id: decoded.id,
        role: dbUser.role,
        email: decoded.email,
        convenio: dbUser.convenio
      };
      
      next();
    } catch (error) {
      console.error("Error en Middleware Auth:", error);
      res.status(500).json({ error: 'Error verificando estado de usuario' });
    }
  });
};