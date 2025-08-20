import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { runSchemaIfNeeded } from './config/database.js';

import authRoutes from './routes/authRoutes.js';
import upiRoutes from './routes/upiRoutes.js';
import billRoutes from './routes/billRoutes.js';
import rechargeRoutes from './routes/rechargeRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import merchantRoutes from './routes/merchantRoutes.js';
import bankRoutes from './routes/bankRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import securityRoutes from './routes/securityRoutes.js';

import { errorHandler } from './middleware/errorHandler.js';
import rateLimit from 'express-rate-limit';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    standardHeaders: true,
    legacyHeaders: false
  })
);


runSchemaIfNeeded();


app.use('/api/auth', authRoutes);
app.use('/api/upi', upiRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/recharge', rechargeRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/bank-accounts', bankRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/security', securityRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));


app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
