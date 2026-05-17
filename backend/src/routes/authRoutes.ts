import { Router } from 'express';
import { login, registerMinorista, adminCreateUser, uploadClientsExcel, changePassword } from '../controllers/authController';
import { verifyTokenAndStatus } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/login', login);
router.post('/register-minorista', registerMinorista);
router.post('/change-password', verifyTokenAndStatus, changePassword); // Cambio de clave para clientes

// Ruta del Panel Admin para subir masivamente el Excel de Clientes
router.post('/upload-clients', verifyTokenAndStatus, upload.single('file'), uploadClientsExcel);
router.post('/admin/create-user', verifyTokenAndStatus, adminCreateUser);

export default router;