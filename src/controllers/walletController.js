import { db } from '../config/database.js';
import { WalletModel } from '../models/wallet.js';
import { TxModel } from '../models/transaction.js';
import { v4 as uuidv4 } from 'uuid';

export const getBalance = (req, res) => {
  const bal = WalletModel.getBalance(req.user.id);
  res.json({ success: true, balance: bal });
};

export const addMoney = (req, res, next) => {
  try {
    const { amount, sourceAccountId } = req.body || {};
    if (!amount || !sourceAccountId) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'amount and sourceAccountId required' } });
    const bank = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND user_id = ?').get(sourceAccountId, req.user.id);
    if (!bank) return res.status(400).json({ success: false, error: { code: 'BANK_INVALID', message: 'Bank not verified/owned' } });
    const bal = db.prepare('SELECT available_amount FROM bank_account_balances WHERE bank_account_id = ?').get(sourceAccountId);
    if (!bal || bal.available_amount < Number(amount)) return res.status(409).json({ success: false, error: { code: 'INSUFFICIENT_BANK_BAL', message: 'Insufficient bank balance' } });
    const txnId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const t = db.transaction(() => {
      TxModel.create({ id: txnId, user_id: req.user.id, type: 'wallet_add', amount: Number(amount), description: `Add money from ${bank.bank_name}`, reference: uuidv4() });
      db.prepare(`
  UPDATE bank_account_balances 
  SET available_amount = available_amount - ?, 
      updated_at = datetime('now')
  WHERE bank_account_id = ?
`).run(Number(amount), sourceAccountId);

      const closing = WalletModel.credit(req.user.id, Number(amount), txnId);
      TxModel.setStatus(txnId, 'success', closing);
    });
    t();
    return res.json({ success: true, transactionId: txnId, status: 'success', amount: Number(amount) });
  } catch (e) {
    return next(e);
  }
};

export const walletTransactions = (req, res) => {
  const items = WalletModel.history(req.user.id, 100);
  res.json({ success: true, transactions: items });
};
