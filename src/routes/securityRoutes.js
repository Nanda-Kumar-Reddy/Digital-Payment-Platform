import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { verifyPin, changePin, blockAccount } from '../controllers/securityController.js';

const securityRoutes = Router();
securityRoutes.post('/verify-pin', authenticateToken, verifyPin);
securityRoutes.put('/change-pin', authenticateToken, changePin);
securityRoutes.post('/block-account', authenticateToken, blockAccount);
export default securityRoutes;
