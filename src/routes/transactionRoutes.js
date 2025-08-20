import { Router } from 'express';
import { listTransactions, getTransaction, raiseDispute } from '../controllers/transactionController.js';
import { authenticateToken } from '../middleware/auth.js';

const transactionRoutes = Router();
transactionRoutes.get('/', authenticateToken, listTransactions);
transactionRoutes.get('/:id', authenticateToken, getTransaction);
transactionRoutes.post('/:id/raise-dispute', authenticateToken, raiseDispute);

export default transactionRoutes;
