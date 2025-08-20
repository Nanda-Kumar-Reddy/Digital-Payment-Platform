import { Router } from 'express';
import { registerMerchant, generateQR, settlements } from '../controllers/merchantController.js';
import { authenticateToken } from '../middleware/auth.js';

const merchantRoutes = Router();
merchantRoutes.post('/register', authenticateToken, registerMerchant);
merchantRoutes.post('/generate-qr', authenticateToken, generateQR);
merchantRoutes.get('/settlements', authenticateToken, settlements);

export default merchantRoutes;
