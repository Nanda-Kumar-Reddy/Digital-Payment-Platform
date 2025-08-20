import { db } from '../config/database.js';
import { UPI_REGEX } from '../utils/constants.js';

export const addContact = (req, res) => {
  const { name, upiId, mobile } = req.body || {};
  if (!name) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name required' } });
  if (!upiId && !mobile) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'upiId or mobile required' } });
  if (upiId && !UPI_REGEX.test(upiId)) return res.status(400).json({ success: false, error: { code: 'INVALID_UPI', message: 'UPI invalid' } });
  const exists = db.prepare('SELECT 1 FROM contacts WHERE user_id = ? AND (upi_id = ? OR mobile = ?)').get(req.user.id, upiId || null, mobile || null);
  if (exists) return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Contact exists' } });
  db.prepare("INSERT INTO contacts (user_id, name, upi_id, mobile, verified, last_interacted_at) VALUES (?, ?, ?, ?, ?, datetime('now'))")
    .run(req.user.id, name, upiId || null, mobile || null, upiId ? 1 : 0);
  res.json({ success: true, message: 'Contact added' });
};

export const listContacts = (req, res) => {
  const rows = db.prepare('SELECT id, name, upi_id, mobile, verified, last_interacted_at FROM contacts WHERE user_id = ? ORDER BY last_interacted_at DESC').all(req.user.id);
  res.json({ success: true, contacts: rows });
};
