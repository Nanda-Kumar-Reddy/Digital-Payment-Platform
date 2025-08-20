import { db } from '../config/database.js';

export const BankAccountModel = {
  link(user_id, bank_name, ifsc, account_number, holder_name, is_primary = 0) {
    const info = db.prepare('INSERT INTO bank_accounts (user_id, bank_name, ifsc, account_number, holder_name, is_verified, is_primary, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, datetime("now"))')
      .run(user_id, bank_name, ifsc, account_number, holder_name, is_primary);
    const id = info.lastInsertRowid;
    db.prepare('INSERT OR REPLACE INTO bank_account_balances (bank_account_id, available_amount, updated_at) VALUES (?, ?, datetime("now"))')
      .run(id, 1000000);
    return id;
  },
  list(user_id) {
    return db.prepare('SELECT id, bank_name, ifsc, account_number, holder_name, is_verified, is_primary FROM bank_accounts WHERE user_id = ?').all(user_id);
  },
  get(id) {
    return db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(id);
  },
  remove(id) {
    db.prepare('DELETE FROM bank_accounts WHERE id = ?').run(id);
  }
};
