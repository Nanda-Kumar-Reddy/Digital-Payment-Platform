import { TxModel } from '../models/transaction.js';
import { db } from '../config/database.js';

export const listTransactions = (req, res) => {
  const tx = TxModel.getByUser(req.user.id, req.query || {});
  res.json({ success: true, transactions: tx });
};

export const getTransaction = (req, res) => {
  const { id } = req.params;
  const t = TxModel.get(id);
  if (!t) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } });
  if (t.user_id !== req.user.id) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not allowed' } });
  res.json({ success: true, transaction: t });
};

export const raiseDispute = (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || 'Invalid transaction';
  if (!reason) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'reason required' } });
  const t = TxModel.get(id);
  if (!t) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } });
  db.prepare("INSERT INTO disputes (txn_id, user_id, reason, status, created_at) VALUES (?, ?, ?, 'open', datetime('now'))").run(id, req.user.id, reason);
  res.json({ success: true, message: 'Dispute raised' });
};
