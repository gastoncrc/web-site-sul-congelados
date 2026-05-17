import { Router } from 'express';
import { getProductsByConvenio, uploadCsvConvenios, adminUpsertProductManual } from '../controllers/productController';
import { verifyTokenAndStatus } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Esta ruta maneja el catálogo de forma dual (público sin login o filtrado si viene con Token válido)
router.get('/', verifyTokenAndStatus, getProductsByConvenio);
router.post('/upload-prices', verifyTokenAndStatus, upload.single('file'), uploadCsvConvenios);
router.post('/manual-upsert', verifyTokenAndStatus, adminUpsertProductManual);

export default router;