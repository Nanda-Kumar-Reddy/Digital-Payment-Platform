import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import { createOtpSession, verifyOtp } from '../utils/otp.js';
import { hashPIN } from '../utils/encryption.js';
import { UserModel } from '../models/user.js';
// import { generateIdempotencyKey } from '../utils/idempotency.js';
import crypto from 'crypto';


function generateIdempotencyKey() {
  return crypto.randomBytes(16).toString('hex');
}


function hashRequestBody(body) {
  return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
}
export const register = (req, res) => {
    console.log('Registering user:', req.body);
  const { name, mobile, email } = req.body || {};
  if (!name || !mobile) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name and mobile required' } });
  const existing = db.prepare('SELECT * FROM users WHERE mobile = ?').get(mobile);
  console.log('Existing user:', existing);
  if (existing) {

    const { sessionId, otp } = createOtpSession(mobile, 'login');
    return res.json({ success: true, message: 'OTP sent to mobile', sessionId, debugOtp: otp });
  }
  const { sessionId, otp } = createOtpSession(mobile, 'register');
  return res.json({ success: true, message: 'OTP sent to mobile', sessionId, debugOtp: otp });
};

export const verifyOtpCtl = (req, res) => {
    console.log('Verifying OTP:', req.body);
  const { sessionId, otp, name, email } = req.body || {};
  if (!sessionId || !otp) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'sessionId and otp required' } });
  const v = verifyOtp(sessionId, otp);
  console.log('OTP verification result:', v);
  if (!v.ok) return res.status(401).json({ success: false, error: { code: 'OTP_INVALID', message: v.reason } });
  let user = db.prepare('SELECT * FROM users WHERE mobile = ?').get(v.mobile);
  if (!user) user = UserModel.create({ name: name || 'User', mobile: v.mobile, email: email || null });
  const token = jwt.sign({ sub: user.id, mobile: user.mobile }, process.env.JWT_SECRET || 'MY_SECRET_TOKEN', { expiresIn: process.env.JWT_EXPIRES || '7d' });
  return res.json({ success: true, token, user: { id: user.id, name: user.name, mobile: user.mobile, kycStatus: user.kyc_status } });
};

export const setPin = async (req, res) => {
  const { pin } = req.body || {};
  if (!pin || !/^\d{4,6}$/.test(String(pin))) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'pin must be 4-6 digits' } });
  const h = await hashPIN(String(pin));
  db.prepare('UPDATE user_security SET pin_hash = ?, pin_set_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(h, req.user.id);
  return res.json({ success: true, message: 'PIN set' });
};

export const login = async (req, res) => {
  const { mobile, pin } = req.body || {};
  if (!mobile || !pin) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'mobile and pin required' } });
  const user = db.prepare('SELECT * FROM users WHERE mobile = ?').get(mobile);
  if (!user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
  const sec = db.prepare('SELECT * FROM user_security WHERE user_id = ?').get(user.id);
  if (!sec || !sec.pin_hash) return res.status(401).json({ success: false, error: { code: 'PIN_NOT_SET', message: 'Pin not set' } });
  const ok = await (await import('argon2')).default.verify(sec.pin_hash, String(pin)).catch(() => false);
  if (!ok) return res.status(401).json({ success: false, error: { code: 'INVALID_PIN', message: 'Invalid PIN' } });
  const token = jwt.sign({ sub: user.id, mobile: user.mobile }, process.env.JWT_SECRET || 'MY_SECRET_TOKEN', { expiresIn: process.env.JWT_EXPIRES || '7d' });
  return res.json({ success: true, token, user: { id: user.id, name: user.name, mobile: user.mobile, kycStatus: user.kyc_status } });
};



export const genIdempontencyKey = (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      });
    }

    const key = generateIdempotencyKey();
    const endpoint = "completeKyc"; 
    const requestHash = hashRequestBody({}); 

    db.prepare(
      `INSERT INTO idempotency_keys (id, user_id, endpoint, request_hash) 
       VALUES (?, ?, ?, ?)`
    ).run(key, userId, endpoint, requestHash);

    return res.json({
      success: true,
      message: 'Use this key for KYC completion',
      idempotencyKey: key
    });
  } catch (err) {
    console.error('KYC init error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Could not initialize KYC' }
    });
  }
};

export const completeKyc = (req, res) => {
  try {
    const userId = req.user?.id;
    const idemKey = req.headers['idempotency-key'];
    const endpoint = "completeKyc";
    const requestHash = hashRequestBody(req.body || {});

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      });
    }

    if (!idemKey) {
      return res.status(400).json({
        success: false,
        error: { code: 'IDEMPOTENCY_REQUIRED', message: 'Idempotency-Key header required' }
      });
    }

    // Check if the key exists already
    const existing = db.prepare(
      'SELECT * FROM idempotency_keys WHERE user_id = ? AND id = ?'
    ).get(userId, idemKey);

    if (existing && existing.response_json) {
      // Idempotent response
      return res.status(existing.status_code).json(JSON.parse(existing.response_json));
    }

    // Update KYC status
    const stmt = db.prepare('UPDATE users SET kyc_status = ? WHERE id = ?');
    const result = stmt.run('completed', userId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    const response = {
      success: true,
      message: 'KYC completed successfully',
      idempotencyKey: idemKey
    };


    db.prepare(
      `INSERT OR REPLACE INTO idempotency_keys 
       (id, user_id, endpoint, request_hash, response_json, status_code) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      idemKey,
      userId,
      endpoint,
      requestHash,
      JSON.stringify(response),
      200
    );

    return res.json(response);
  } catch (err) {
    console.error('KYC update error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Could not update KYC' }
    });
  }
};


