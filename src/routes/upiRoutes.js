import { Router } from 'express';
import { authenticateToken, requireKYC } from '../middleware/auth.js';
import { verifyPIN } from '../middleware/pinVerification.js';
import { idempotency } from '../middleware/idempotency.js';

import { createUpi, sendMoney, requestMoney, scanPay } from '../controllers/upiController.js';

const upiRoutes = Router();

upiRoutes.post('/create-id', authenticateToken, requireKYC('pending'), createUpi);
upiRoutes.post('/send', authenticateToken, requireKYC('min_kys'), verifyPIN, idempotency('upi_send'), sendMoney);
upiRoutes.post('/request', authenticateToken, requireKYC('pending'), requestMoney);
upiRoutes.post('/scan-pay', authenticateToken, requireKYC('min_kys'), verifyPIN, idempotency('upi_scanpay'), scanPay);

export default upiRoutes;
