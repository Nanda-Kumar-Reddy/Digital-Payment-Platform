import { db } from '../config/database.js';

export const UserModel = {
  findByMobile(mobile) {
    return db.prepare('SELECT * FROM users WHERE mobile = ?').get(mobile);
  },
  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },
  create({ name, mobile, email }) {
    const info = db.prepare(
  "INSERT INTO users (name, mobile, email, kyc_status) VALUES (?, ?, ?, 'pending')"
).run(name, mobile, email);
    const id = info.lastInsertRowid;
    db.prepare('INSERT OR IGNORE INTO wallet_accounts (user_id, balance) VALUES (?, 0)').run(id);
    db.prepare('INSERT OR IGNORE INTO user_security (user_id) VALUES (?)').run(id);
    db.prepare(
  `INSERT OR IGNORE INTO transaction_limits 
   (user_id, per_txn_limit, daily_limit, monthly_limit, used_today, used_month, window_day, window_month) 
   VALUES (?, ?, ?, ?, 0, 0, strftime('%Y-%m-%d','now'), strftime('%Y-%m','now'))`
).run(id, 1000000, 2000000, 5000000);
    return this.findById(id);
  }
};
