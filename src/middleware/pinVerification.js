import argon2 from 'argon2';
import { db } from '../config/database.js';

export const verifyPIN = async (req, res, next) => {
  const { pin } = req.body;
  if (!pin || !/^\d{4,6}$/.test(String(pin))) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_PIN', message: 'PIN required (4-6 digits)' } });
  }
  const row = db.prepare('SELECT pin_hash, failed_pin_attempts FROM user_security WHERE user_id=?').get(req.user.id);
  if (!row || !row.pin_hash) {
    return res.status(400).json({ success: false, error: { code: 'PIN_NOT_SET', message: 'Set PIN first' } });
  }
  const ok = await argon2.verify(row.pin_hash, String(pin)).catch(() => false);
  if (!ok) {
    db.prepare('UPDATE user_security SET failed_pin_attempts = failed_pin_attempts + 1, last_failed_pin_at = datetime("now") WHERE user_id=?').run(req.user.id);
    return res.status(401).json({ success: false, error: { code: 'INVALID_PIN', message: 'Incorrect PIN' } });
  }

  db.prepare('UPDATE user_security SET failed_pin_attempts = 0 WHERE user_id=?').run(req.user.id);
  next();
};
