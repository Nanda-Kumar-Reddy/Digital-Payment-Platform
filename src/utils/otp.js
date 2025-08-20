import crypto from 'crypto';
import { db } from '../config/database.js';

export function generateOTP(len = 6) {
  const max = 10 ** len;
  return String(Math.floor(Math.random() * max)).padStart(len, '0');
}

export function createOtpSession(mobile, purpose = 'register', ttlSeconds = 30000) {
  const sessionId = `session_${crypto.randomUUID()}`;
  const otp = generateOTP(6);
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  db.prepare(`INSERT INTO otp_sessions (id, mobile, otp_hash, purpose, attempts, max_attempts, expires_at)
              VALUES (?, ?, ?, ?, 0, 5, datetime('now', ?))`).run(sessionId, mobile, otpHash, purpose, `+${ttlSeconds} seconds`);
  return { sessionId, otp };
}

export function verifyOtp(sessionId, otp) {
  console.log('Verifying OTP for session:', sessionId);
  const row = db.prepare('SELECT * FROM otp_sessions WHERE id=?').get(sessionId);
  // console.log('OTP session row:', db.prepare('SELECT id FROM otp_sessions').all());
  console.log('OTP session:', row);
  if (!row) return { ok: false, reason: 'NOT_FOUND' };
  if (row.verified_at) return { ok: false, reason: 'ALREADY_VERIFIED' };

  const expired = (new Date(row.expires_at) < new Date());
  if (expired) return { ok: false, reason: 'EXPIRED' };
  if (row.attempts >= row.max_attempts) return { ok: false, reason: 'TOO_MANY_ATTEMPTS' };
  const check = crypto.createHash('sha256').update(String(otp)).digest('hex') === row.otp_hash;
  db.prepare('UPDATE otp_sessions SET attempts = attempts + 1 WHERE id=?').run(sessionId);
  if (!check) return { ok: false, reason: 'MISMATCH' };
  db.prepare(
  'UPDATE otp_sessions SET verified_at = datetime(\'now\') WHERE id = ?'
).run(sessionId);
  return { ok: true, mobile: row.mobile, purpose: row.purpose };
}
