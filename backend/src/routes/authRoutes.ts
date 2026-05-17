import { Router } from 'express';
import { login, registerMinorista, adminCreateUser } from '../controllers/authController';
import { verifyTokenAndStatus } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register-minorista', registerMinorista);
router.post('/admin/create-user', verifyTokenAndStatus, adminCreateUser);

export default router;