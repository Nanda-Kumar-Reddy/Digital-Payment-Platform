import { Router } from 'express';
import { getBalance, addMoney, walletTransactions } from '../controllers/walletController.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyPIN } from '../middleware/pinVerification.js';
import { idempotency } from '../middleware/idempotency.js';

const walletRoutes = Router();
walletRoutes.get('/balance', authenticateToken, getBalance);
walletRoutes.post('/add-money', authenticateToken, verifyPIN, idempotency('wallet_add'), addMoney);
walletRoutes.get('/transactions', authenticateToken, walletTransactions);

export default walletRoutes;
