
import { db } from '../config/database.js';
import argon2 from 'argon2';
import { hashPIN } from '../utils/encryption.js';

export const verifyPin = async (req, res) => {
  const { pin } = req.body || {};
  if (!pin) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'pin required' } });
  const sec = db.prepare('SELECT pin_hash FROM user_security WHERE user_id = ?').get(req.user.id);
  if (!sec || !sec.pin_hash) return res.status(400).json({ success: false, error: { code: 'PIN_NOT_SET', message: 'Set PIN first' } });
  const ok = await argon2.verify(sec.pin_hash, String(pin)).catch(() => false);
  if (!ok) return res.status(401).json({ success: false, error: { code: 'INVALID_PIN', message: 'Incorrect PIN' } });
  res.json({ success: true, verified: true });
};

export const changePin = async (req, res) => {
  const { oldPin, newPin } = req.body || {};
  if (!oldPin || !newPin) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'oldPin and newPin required' } });
  const sec = db.prepare('SELECT pin_hash FROM user_security WHERE user_id = ?').get(req.user.id);
  if (!sec || !sec.pin_hash) return res.status(400).json({ success: false, error: { code: 'PIN_NOT_SET', message: 'Set PIN first' } });
  const ok = await argon2.verify(sec.pin_hash, String(oldPin)).catch(() => false);
  if (!ok) return res.status(401).json({ success: false, error: { code: 'INVALID_PIN', message: 'Incorrect old PIN' } });
  const h = await hashPIN(String(newPin));
  db.prepare("UPDATE user_security SET pin_hash = ?, pin_set_at = datetime('now') WHERE user_id = ?").run(h, req.user.id);
  res.json({ success: true, message: 'PIN updated' });
};

export const blockAccount = (req, res) => {
  db.prepare("UPDATE users SET kyc_status = 'blocked' WHERE id = ?").run(req.user.id);
  res.json({ success: true, message: 'Account blocked' });
};
