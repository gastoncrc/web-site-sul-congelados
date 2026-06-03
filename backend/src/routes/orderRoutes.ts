import { Router } from 'express';
import { createOrder, getOrders, getOrderDetails } from '../controllers/orderController';
import { verifyTokenAndStatus } from '../middleware/auth';

const router = Router();

// Endpoint público para crear pedidos (para B2C y B2B)
router.post('/', createOrder);

// Endpoints protegidos para ver historial
router.get('/', verifyTokenAndStatus, getOrders);
router.get('/:id', verifyTokenAndStatus, getOrderDetails);

export default router;
