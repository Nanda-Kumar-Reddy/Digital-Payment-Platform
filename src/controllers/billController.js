import { db } from '../config/database.js';
import { AMOUNT_MIN } from '../utils/constants.js';
import { WalletModel } from '../models/wallet.js';
import { TxModel } from '../models/transaction.js';
import { v4 as uuidv4 } from 'uuid';

export const listBillers = (req, res) => {
  const { category, state } = req.query || {};
  const rows = db.prepare('SELECT id, name, category, state, biller_code, parameters_json AS parameters, logo FROM billers WHERE (? IS NULL OR category = ?) AND (? IS NULL OR state = ?)').all(category || null, category || null, state || null, state || null);
  const billers = rows.map(r => ({ ...r, parameters: JSON.parse(r.parameters) }));
  res.json({ success: true, billers });
};

export const fetchBill = (req, res) => {
  const { billerId, parameters } = req.body || {};
  if (!billerId || !parameters) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'billerId and parameters required' } });
  const biller = db.prepare('SELECT * FROM billers WHERE id = ?').get(billerId);
  if (!biller) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Biller not found' } });
  const required = JSON.parse(biller.parameters_json);
  for (const k of required) if (!parameters[k]) return res.status(400).json({ success: false, error: { code: 'MISSING_PARAM', message: `Missing parameter: ${k}` } });
  return res.json({
    success: true,
    bill: {
      amount: 1250 * 100,
      dueDate: '2024-03-25',
      billDate: '2024-03-01',
      consumerName: 'John Doe',
      billNumber: `BILL${Math.floor(Math.random() * 1e6)}`
    }
  });
};

export const payBill = (req, res, next) => {
  try {
    const { billerId, amount, parameters } = req.body || {};
    if (!billerId || !amount || !parameters) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'billerId, amount, parameters required' } });
    if (Number(amount) < AMOUNT_MIN) return res.status(400).json({ success: false, error: { code: 'INVALID_AMOUNT', message: 'Amount too small' } });
    const biller = db.prepare('SELECT * FROM billers WHERE id = ?').get(billerId);
    if (!biller) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Biller not found' } });

    const limitsRow = db.prepare('SELECT * FROM transaction_limits WHERE user_id = ?').get(req.user.id);
    // if (!limitsRow) 

    const txnId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const t = db.transaction(() => {
      TxModel.create({ id: txnId, user_id: req.user.id, type: 'bill_pay', amount: Number(amount), description: `Bill pay to ${biller.name}`, reference: uuidv4() });
      const closing = WalletModel.debit(req.user.id, Number(amount), txnId);
      db.prepare('INSERT INTO bill_payments (user_id, biller_id, bill_reference, amount, status, metadata_json, txn_id, created_at) VALUES (?, ?, ?, ?, "success", ?, ?, datetime("now"))')
        .run(req.user.id, billerId, parameters.consumerNumber || null, Number(amount), JSON.stringify(parameters), txnId);
      TxModel.setStatus(txnId, 'success', closing);
      db.prepare('UPDATE transaction_limits SET used_today = used_today + ?, used_month = used_month + ? WHERE user_id = ?').run(Number(amount), Number(amount), req.user.id);
    });
    t();
    return res.json({ success: true, transactionId: txnId, status: 'success', amount: Number(amount) });
  } catch (e) {
    return next(e);
  }
};
