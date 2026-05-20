import { Router } from 'express';
import { 
  login, 
  changePassword, 
  registerClientAdmin, 
  uploadClientsExcel, 
  registerMinorista, 
  adminCreateUser,
  getClients,
  updateClient // 🚀 1. Agregamos esta importación
} from '../controllers/authController';
import { verifyTokenAndStatus } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Rutas Públicas
router.post('/login', login);
router.post('/register-minorista', registerMinorista);

// Rutas Protegidas por Token de Sesión
router.post('/change-password', verifyTokenAndStatus, changePassword);

// Rutas Exclusivas del Panel de Administración
router.post('/register-client-admin', verifyTokenAndStatus, registerClientAdmin);
router.post('/upload-clients', verifyTokenAndStatus, upload.single('file'), uploadClientsExcel);
router.post('/admin-create-user', verifyTokenAndStatus, adminCreateUser);
router.get('/clients', verifyTokenAndStatus, getClients);

// 🚀 2. ESTA ES LA RUTA QUE TE FALTABA PARA EL 404
router.put('/clients/:id', verifyTokenAndStatus, updateClient);

export default router;