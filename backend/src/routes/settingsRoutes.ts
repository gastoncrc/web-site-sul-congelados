import { Router } from 'express';
import { getSettings, updateSetting } from '../controllers/settingsController';
import { verifyTokenAndStatus } from '../middleware/auth';

const router = Router();

router.get('/', getSettings);
router.post('/update', verifyTokenAndStatus, updateSetting);

export default router;
