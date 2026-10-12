import { Router } from 'express';
import {
  getProductsByConvenio,
  getSliderProducts,
  uploadCsvConvenios,
  upsertIndividualProduct,
  toggleProductFlags,
  setIndividualPrice,
  getAdminProducts,
  deleteProduct,
  getPriceHistory,
  getFavorites,
  toggleFavorite,
  getPriceLists,
  updateBasePrice,
  updateMarkup
} from '../controllers/productController';
import { verifyTokenAndStatus } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Catálogo (Público / Clientes) — paginado vía ?page&limit&search&category
router.get('/', getProductsByConvenio);
router.get('/slider', getSliderProducts);

// Favoritos ("Mis habituales") — solo clientes logueados
router.get('/favorites', verifyTokenAndStatus, getFavorites);
router.post('/favorites/:sku', verifyTokenAndStatus, toggleFavorite);

// Carga Masiva (Admin)
router.post('/upload-prices', verifyTokenAndStatus, upload.single('file'), uploadCsvConvenios);

// Gestión Individual (Admin)
router.post('/individual', verifyTokenAndStatus, upsertIndividualProduct);
router.post('/individual-price', verifyTokenAndStatus, setIndividualPrice);
router.patch('/:sku/flags', verifyTokenAndStatus, toggleProductFlags);

// Listas de precios — precio base por producto + markup por (producto, lista)
router.get('/price-lists', verifyTokenAndStatus, getPriceLists);
router.put('/base-price', verifyTokenAndStatus, updateBasePrice);
router.put('/markup', verifyTokenAndStatus, updateMarkup);

// Rutas exclusivas para la tabla del Admin
router.get('/admin', verifyTokenAndStatus, getAdminProducts);
router.get('/:sku/price-history', verifyTokenAndStatus, getPriceHistory);
router.delete('/:sku', verifyTokenAndStatus, deleteProduct);

export default router;
