import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { link, list, setPrimary, remove } from '../controllers/bankController.js';

const bankRoutes = Router();
bankRoutes.post('/link', authenticateToken, link);
bankRoutes.get('/', authenticateToken, list);
bankRoutes.put('/:id/set-primary', authenticateToken, setPrimary);
bankRoutes.delete('/:id', authenticateToken, remove);

export default bankRoutes;
