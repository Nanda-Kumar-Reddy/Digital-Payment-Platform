import { db } from '../config/database.js';
import { WalletModel } from '../models/wallet.js';
import { TxModel } from '../models/transaction.js';
import { v4 as uuidv4 } from 'uuid';

export const operatorsList = (_req, res) => {
  const rows = db.prepare('SELECT id, name FROM recharge_operators').all();
  res.json({ success: true, operators: rows });
};

export const plansList = (req, res) => {
  const { operator, circle, type } = req.query || {};
  if (!operator || !circle || !type) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'operator, circle, type required' } });
  const op = db.prepare('SELECT id FROM recharge_operators WHERE name = ?').get(operator);
  if (!op) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Operator not found' } });
  const rows = db.prepare('SELECT * FROM recharge_plans WHERE operator_id = ? AND circle = ? AND plan_type = ?').all(op.id, circle, type);
  res.json({ success: true, plans: rows });
};

export const rechargeMobile = (req, res, next) => {
  try {
    const { mobile, operator, circle, planId, amount } = req.body || {};
    if (!mobile || !operator || !circle || !amount) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'mobile, operator, circle, amount required' } });
    const op = db.prepare('SELECT id FROM recharge_operators WHERE name = ?').get(operator);
    if (!op) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Operator not found' } });
    const txnId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const t = db.transaction(() => {
      TxModel.create({ id: txnId, user_id: req.user.id, type: 'recharge', amount: Number(amount), description: `Recharge ${mobile}`, reference: uuidv4() });
      const closing = WalletModel.debit(req.user.id, Number(amount), txnId);
      db.prepare('INSERT INTO mobile_recharges (user_id, mobile, operator_id, circle, plan_id, amount, status, txn_id, created_at) VALUES (?, ?, ?, ?, ?, ?, "success", ?, datetime("now"))')
        .run(req.user.id, mobile, op.id, circle, planId || null, Number(amount), txnId);
      TxModel.setStatus(txnId, 'success', closing);
      db.prepare('UPDATE transaction_limits SET used_today = used_today + ?, used_month = used_month + ? WHERE user_id = ?').run(Number(amount), Number(amount), req.user.id);
    });
    t();
    return res.json({ success: true, transactionId: txnId, status: 'success', amount: Number(amount) });
  } catch (e) {
    return next(e);
  }
};
