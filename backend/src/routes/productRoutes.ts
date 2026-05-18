import { Router } from 'express';
import { getProductsByConvenio, uploadCsvConvenios, upsertIndividualProduct, toggleProductFlags, setIndividualPrice } from '../controllers/productController';
import { verifyTokenAndStatus } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Catálogo (Público / Clientes)
router.get('/', getProductsByConvenio);

// Carga Masiva (Admin)
router.post('/upload-prices', verifyTokenAndStatus, upload.single('file'), uploadCsvConvenios);

// NUEVAS: Gestión Individual (Admin)
router.post('/individual', verifyTokenAndStatus, upsertIndividualProduct);
router.post('/individual-price', verifyTokenAndStatus, setIndividualPrice);
router.patch('/:sku/flags', verifyTokenAndStatus, toggleProductFlags);

export default router;