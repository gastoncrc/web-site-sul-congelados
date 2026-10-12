import { Router } from 'express';
import {
  login,
  changePassword,
  registerClientAdmin,
  uploadClientsExcel,
  registerMinorista,
  adminCreateUser,
  getClients,
  updateClient, // 🚀 1. Agregamos esta importación
  setAccountStatus,
  generatePassword,
  setPassword,
  forgotPassword,
  resetPassword
} from '../controllers/authController';
import { verifyTokenAndStatus } from '../middleware/auth';
import multer from 'multer';
import rateLimit from 'express-rate-limit';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Máximo 10 intentos de login por IP cada 15 minutos, para frenar fuerza bruta.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Probá de nuevo en unos minutos.' },
});

// Máximo 5 solicitudes de recuperación de contraseña por IP cada 15 minutos.
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Probá de nuevo en unos minutos.' },
});

// Rutas Públicas
router.post('/login', loginLimiter, login);
router.post('/register-minorista', registerMinorista);
router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/reset-password', resetLimiter, resetPassword);

// Rutas Protegidas por Token de Sesión
router.post('/change-password', verifyTokenAndStatus, changePassword);

// Rutas Exclusivas del Panel de Administración
router.post('/register-client-admin', verifyTokenAndStatus, registerClientAdmin);
router.post('/upload-clients', verifyTokenAndStatus, upload.single('file'), uploadClientsExcel);
router.post('/admin-create-user', verifyTokenAndStatus, adminCreateUser);
router.get('/clients', verifyTokenAndStatus, getClients);

// 🚀 2. ESTA ES LA RUTA QUE TE FALTABA PARA EL 404
router.put('/clients/:id', verifyTokenAndStatus, updateClient);

// Gestión de cuentas (cualquier rol) — estado y contraseñas
router.put('/users/:id/status', verifyTokenAndStatus, setAccountStatus);
router.post('/users/:id/generate-password', verifyTokenAndStatus, generatePassword);
router.post('/users/:id/set-password', verifyTokenAndStatus, setPassword);

export default router;