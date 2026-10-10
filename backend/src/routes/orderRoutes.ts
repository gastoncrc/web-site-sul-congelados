import { Router } from 'express';
import { createOrder, getOrders, getOrderDetails, updateOrderStatus, getDashboardStats } from '../controllers/orderController';
import { verifyTokenAndStatus } from '../middleware/auth';

const router = Router();

// Endpoint público para crear pedidos (para B2C y B2B) — el middleware es
// "fail-open": si no hay token (invitado) sigue adelante igual; si hay token
// válido, resuelve el convenio real del cliente para calcular precios.
router.post('/', verifyTokenAndStatus, createOrder);

// Dashboard
router.get('/stats', verifyTokenAndStatus, getDashboardStats);

// Endpoints protegidos para ver historial
router.get('/', verifyTokenAndStatus, getOrders);
router.get('/:id', verifyTokenAndStatus, getOrderDetails);
router.patch('/:id/status', verifyTokenAndStatus, updateOrderStatus);

export default router;
