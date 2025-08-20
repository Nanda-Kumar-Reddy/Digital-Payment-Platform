import { Router } from 'express';
import { listBillers, fetchBill, payBill } from '../controllers/billController.js';
import { authenticateToken, requireKYC } from '../middleware/auth.js';
import { verifyPIN } from '../middleware/pinVerification.js';
import { idempotency } from '../middleware/idempotency.js';

const billRoutes = Router();

billRoutes.get('/billers',authenticateToken, listBillers);
billRoutes.post('/fetch',authenticateToken, fetchBill);
billRoutes.post('/pay', authenticateToken, requireKYC('min_kys'), verifyPIN, idempotency('bill_pay'), payBill);

export default billRoutes;
