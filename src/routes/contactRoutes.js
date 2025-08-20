import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { addContact, listContacts } from '../controllers/contactController.js';

const contactRoutes = Router();
contactRoutes.post('/add', authenticateToken, addContact);
contactRoutes.get('/', authenticateToken, listContacts);
export default contactRoutes;
