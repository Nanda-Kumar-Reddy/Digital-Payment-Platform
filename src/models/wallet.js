import { db } from '../config/database.js';

export const WalletModel = {
  getBalance(user_id) {
    const row = db.prepare('SELECT balance FROM wallet_accounts WHERE user_id = ?').get(user_id);
    return row ? row.balance : 0;
  },
  debit(user_id, amount, txn_id) {
    const bal = this.getBalance(user_id);
    const newBal = bal - amount;
    if (newBal < 0) {
      const e = new Error('Insufficient wallet balance');
      e.status = 409; e.code = 'INSUFFICIENT_BALANCE';
      throw e;
    }
    db.prepare(`
  UPDATE wallet_accounts 
  SET balance = ?, 
      updated_at = datetime('now') 
  WHERE user_id = ?
`).run(newBal, user_id);

db.prepare(`
  INSERT INTO wallet_ledger 
    (user_id, txn_id, entry_type, amount, balance_after, created_at) 
  VALUES (?, ?, 'debit', ?, ?, datetime('now'))
`).run(user_id, txn_id, amount, newBal);

    return newBal;
  },
  credit(user_id, amount, txn_id) {
  const bal = this.getBalance(user_id);
  const newBal = bal + amount;

  // Update wallet balance
  db.prepare(`
    UPDATE wallet_accounts 
    SET balance = ?, updated_at = datetime('now') 
    WHERE user_id = ?
  `).run(newBal, user_id);

  
  db.prepare(`
    INSERT INTO wallet_ledger 
      (user_id, txn_id, entry_type, amount, balance_after, created_at) 
    VALUES (?, ?, 'credit', ?, ?, datetime('now'))
  `).run(user_id, txn_id, amount, newBal);


    return newBal;
  },
  history(user_id, limit = 100) {
    return db.prepare('SELECT * FROM wallet_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(user_id, limit);
  }
};
