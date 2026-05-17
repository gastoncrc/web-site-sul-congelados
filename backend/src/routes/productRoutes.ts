import { Router } from 'express';
import { getProductsByConvenio, uploadCsvConvenios } from '../controllers/productController';
import { verifyTokenAndStatus } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getProductsByConvenio);

// 📦 Panel Admin: CON bloqueo de seguridad obligatorio para la carga masiva del Excel
router.post('/upload-prices', verifyTokenAndStatus, upload.single('file'), uploadCsvConvenios);

export default router;