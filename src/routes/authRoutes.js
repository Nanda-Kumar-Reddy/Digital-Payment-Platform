import { Router } from 'express';
import { register, verifyOtpCtl, setPin, login,completeKyc,genIdempontencyKey } from '../controllers/authController.js';
const authRoutes = Router();
import { authenticateToken } from '../middleware/auth.js';

authRoutes.post('/register', register);
authRoutes.post('/verify-otp', verifyOtpCtl);
authRoutes.post('/set-pin', authenticateToken,setPin); 
authRoutes.post('/login',authenticateToken, login);
authRoutes.post('/kyc-complete', authenticateToken, completeKyc);
authRoutes.get('/init',authenticateToken,genIdempontencyKey) 
export default authRoutes;
