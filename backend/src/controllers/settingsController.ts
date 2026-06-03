import { Request, Response } from 'express';
import { pool } from '../config/db';

export const getSettings = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM settings');
    const settings: Record<string, string> = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener ajustes' });
  }
};

export const updateSetting = async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Admin') return res.status(403).json({ error: 'Acceso denegado' });
  
  const { key, value } = req.body;
  if (!key || value === undefined) return res.status(400).json({ error: 'Faltan parámetros' });

  try {
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      [key, value]
    );
    res.json({ message: 'Ajuste actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar ajuste' });
  }
};
