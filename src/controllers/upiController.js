import { db } from '../config/database.js';
import { UPI_REGEX, AMOUNT_MIN } from '../utils/constants.js';
import { WalletModel } from '../models/wallet.js';
import { TxModel } from '../models/transaction.js';
import { v4 as uuidv4 } from 'uuid';
import { parseUpiUri } from '../utils/qrParser.js';

function checkLimits(user_id, amount) {
  const row = db.prepare('SELECT * FROM transaction_limits WHERE user_id = ?').get(user_id);
  if (!row) return;
  const today = db.prepare("SELECT strftime('%Y-%m-%d','now') AS d").get().d;
  const month = db.prepare("SELECT strftime('%Y-%m','now') AS m").get().m;
  if (row.window_day !== today) db.prepare('UPDATE transaction_limits SET used_today = 0, window_day = ? WHERE user_id = ?').run(today, user_id);
  if (row.window_month !== month) db.prepare('UPDATE transaction_limits SET used_month = 0, window_month = ? WHERE user_id = ?').run(month, user_id);
  const current = db.prepare('SELECT * FROM transaction_limits WHERE user_id = ?').get(user_id);
  if (amount > current.per_txn_limit) { const e = new Error('Per-transaction limit exceeded'); e.status = 403; e.code = 'LIMIT_PER_TXN'; throw e; }
  if (current.used_today + amount > current.daily_limit) { const e = new Error('Daily limit exceeded'); e.status = 403; e.code = 'LIMIT_DAILY'; throw e; }
  if (current.used_month + amount > current.monthly_limit) { const e = new Error('Monthly limit exceeded'); e.status = 403; e.code = 'LIMIT_MONTHLY'; throw e; }
}

function consumeLimits(user_id, amount) {
  db.prepare('UPDATE transaction_limits SET used_today = used_today + ?, used_month = used_month + ? WHERE user_id = ?').run(amount, amount, user_id);
}

export const createUpi = (req, res) => {
  const { upiId, bankAccountId } = req.body || {};
  if (!upiId || !UPI_REGEX.test(upiId)) return res.status(422).json({ success: false, error: { code: 'INVALID_UPI', message: 'Invalid UPI format' } });
  const bank = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?').get(bankAccountId, req.user.id);
//   console.log('Bank account:',db.prepare('SELECT * FROM bank_accounts').all() );
  if (!bank) return res.status(400).json({ success: false, error: { code: 'BANK_INVALID', message: 'Bank not verified/owned' } });
  const exists = db.prepare('SELECT 1 FROM upi_ids WHERE upi = ?').get(upiId);
  if (exists) return res.status(409).json({ success: false, error: { code: 'UPI_EXISTS', message: 'UPI already exists' } });
  db.prepare(
  "INSERT INTO upi_ids (user_id, upi, bank_account_id, status, created_at) VALUES (?, ?, ?, 'active', datetime('now'))"
).run(req.user.id, upiId, bankAccountId);
  return res.json({ success: true, upiId, message: 'UPI ID created' });
};

export const sendMoney = (req, res, next) => {
  try {
    const { recipientUpiId, amount: rawAmount, note } = req.body || {};
    if (!recipientUpiId || !UPI_REGEX.test(recipientUpiId)) return res.status(422).json({ success: false, error: { code: 'INVALID_UPI', message: 'Invalid recipient UPI' } });
    const amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount < AMOUNT_MIN) return res.status(400).json({ success: false, error: { code: 'INVALID_AMOUNT', message: 'Amount too small' } });

    checkLimits(req.user.id, amount);
    const txnId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const t = db.transaction(() => {
      TxModel.create({ id: txnId, user_id: req.user.id, type: 'upi_send', amount, description: note || `Payment to ${recipientUpiId}`, reference: uuidv4(), counterparty_upi: recipientUpiId });
      const closing = WalletModel.debit(req.user.id, amount, txnId);
      TxModel.setStatus(txnId, 'success', closing);
      consumeLimits(req.user.id, amount);
    });
    t();
    return res.json({ success: true, transactionId: txnId, status: 'success', amount, timestamp: new Date().toISOString() });
  } catch (e) {
    return next(e);
  }
};

export const requestMoney = (req, res) => {
  const { payerUpiId, amount, note, expiryMinutes } = req.body || {};
  if (!payerUpiId || !UPI_REGEX.test(payerUpiId)) return res.status(422).json({ success: false, error: { code: 'INVALID_UPI', message: 'Invalid payer UPI' } });
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt < AMOUNT_MIN) return res.status(400).json({ success: false, error: { code: 'INVALID_AMOUNT', message: 'Invalid amount' } });
  const txnId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
  TxModel.create({ id: txnId, user_id: req.user.id, type: 'upi_collect', amount: amt, description: note || `Request from ${payerUpiId}`, reference: `COLLECT-${uuidv4()}`, counterparty_upi: payerUpiId });
  db.prepare("UPDATE transactions SET status = 'pending' WHERE id = ?").run(txnId);

  return res.json({ success: true, requestId: txnId, status: 'pending', expiresInMinutes: expiryMinutes || 60 });
};

export const scanPay = (req, res, next) => {
  const { qrData } = req.body || {};
  const parsed = parseUpiUri(qrData);
  if (!parsed || !parsed.pa) return res.status(400).json({ success: false, error: { code: 'QR_INVALID', message: 'Invalid UPI QR' } });
  req.body.recipientUpiId = parsed.pa;
  if (parsed.am) req.body.amount = parsed.am;
  req.body.note = parsed.pn || 'QR payment';
  return sendMoney(req, res, next);
};
