import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';

export const authenticateToken = (req, res, next) => {
  let jwtToken;
  const authHeader = req.headers['authorization'];
  if (authHeader !== undefined) {
    const parts = authHeader.split(' ');
    if (parts.length === 2) jwtToken = parts[1];
  }
  if (!jwtToken) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid JWT Token' } });
    return;
  }
  jwt.verify(jwtToken, process.env.JWT_SECRET || 'MY_SECRET_TOKEN', (error, payload) => {
    if (error) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid JWT Token' } });
      return;
    }
    req.user = { id: payload.sub, mobile: payload.mobile || null };
    next();
  });
};


export const requireKYC = (minLevel = 'pending') => {
  const ranks = { blocked: -1, pending: 0, min_kys: 1, full: 2 };
  return (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing user' } });
    }
    const row = db.prepare('SELECT kyc_status FROM users WHERE id=?').get(req.user.id);
    if (!row) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } });
    if (row.kyc_status === 'blocked') return res.status(403).json({ success: false, error: { code: 'ACCOUNT_BLOCKED', message: 'Account blocked' } });
    if (ranks[row.kyc_status] < ranks[minLevel]) return res.status(403).json({ success: false, error: { code: 'KYC_REQUIRED', message: 'Complete KYC' } });
    next();
  };
};
