import { db } from '../config/database.js';
import { IFSC_REGEX } from '../utils/constants.js';
import { maskAccountNumber } from '../utils/helpers.js';

export const link = (req, res) => {
  const { accountNumber, ifscCode, accountHolderName } = req.body || {};
  if (!accountNumber || !ifscCode || !accountHolderName) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'accountNumber, ifscCode, accountHolderName required' } });
  if (!/^\d{6,18}$/.test(String(accountNumber))) return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'accountNumber invalid' } });
  if (!IFSC_REGEX.test(String(ifscCode))) return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'IFSC invalid' } });
  const isFirst = !db.prepare('SELECT 1 FROM bank_accounts WHERE user_id = ?').get(req.user.id);
  const info = db.prepare('INSERT INTO bank_accounts (user_id, bank_name, ifsc, account_number, holder_name, is_verified, is_primary, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, datetime(\'now\'))')
    .run(req.user.id, 'Bank', ifscCode, accountNumber, accountHolderName, isFirst ? 1 : 0);
  db.prepare(
  'INSERT OR REPLACE INTO bank_account_balances (bank_account_id, available_amount, updated_at) VALUES (?, ?, datetime(\'now\'))'
).run(info.lastInsertRowid, 1000000);
  const verificationId = `VER${Date.now()}`;
  res.json({ success: true, message: 'Account verification in progress', accountId: info.lastInsertRowid, verificationId });
};

export const list = (req, res) => {
  const rows = db.prepare('SELECT id, bank_name, ifsc, account_number, holder_name, is_verified, is_primary FROM bank_accounts WHERE user_id = ?').all(req.user.id);
  res.json({ success: true, accounts: rows.map(r => ({ ...r, account_number: maskAccountNumber(r.account_number) })) });
};

export const setPrimary = (req, res) => {
  const id = Number(req.params.id);
  const owned = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!owned) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });
  const t = db.transaction(() => {
    db.prepare('UPDATE bank_accounts SET is_primary = 0 WHERE user_id = ?').run(req.user.id);
    db.prepare('UPDATE bank_accounts SET is_primary = 1 WHERE id = ?').run(id);
  });
  t();
  res.json({ success: true, message: 'Primary account updated' });
};

export const remove = (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!row) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });
  const linkedUPI = db.prepare('SELECT 1 FROM upi_ids WHERE bank_account_id = ?').get(id);
  if (linkedUPI) return res.status(409).json({ success: false, error: { code: 'ACCOUNT_LINKED', message: 'Unlink UPI first' } });
  db.prepare('DELETE FROM bank_accounts WHERE id = ?').run(id);
  res.json({ success: true, message: 'Account removed' });
};
