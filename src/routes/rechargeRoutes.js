import { Router } from 'express';
import { operatorsList, plansList, rechargeMobile } from '../controllers/rechargeController.js';
import { authenticateToken, requireKYC } from '../middleware/auth.js';
import { verifyPIN } from '../middleware/pinVerification.js';
import { idempotency } from '../middleware/idempotency.js';

const rechargeRoutes = Router();
rechargeRoutes.get('/operators', operatorsList);
rechargeRoutes.get('/plans', plansList);
rechargeRoutes.post('/mobile', authenticateToken, requireKYC('min_kys'), verifyPIN, idempotency('recharge_mobile'), rechargeMobile);

export default rechargeRoutes;
