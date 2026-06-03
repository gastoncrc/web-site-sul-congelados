import { Router } from 'express';
import { getVendorClients } from '../controllers/vendorController';
import { verifyTokenAndStatus } from '../middleware/auth';

const router = Router();
router.get('/clients', verifyTokenAndStatus, getVendorClients);
export default router;  