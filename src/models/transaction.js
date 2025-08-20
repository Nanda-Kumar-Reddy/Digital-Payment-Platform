import { db } from '../config/database.js';

export const TxModel = {
  create({ 
    id, 
    user_id, 
    type, 
    amount, 
    description = null, 
    reference = null, 
    counterparty_upi = null 
  }) {
    db.prepare(`
      INSERT INTO transactions 
        (id, user_id, type, amount, status, description, reference, counterparty_upi, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, datetime('now'), datetime('now'))
    `).run(id, user_id, type, amount, description, reference, counterparty_upi);
  },

  setStatus(id, status, closing_balance = null) {
    db.prepare(`
      UPDATE transactions 
      SET status = ?, 
          closing_balance = COALESCE(?, closing_balance), 
          updated_at = datetime('now') 
      WHERE id = ?
    `).run(status, closing_balance, id);
  },

  getByUser(user_id, filters = {}) {
    let sql = `SELECT * FROM transactions WHERE user_id = ?`;
    const params = [user_id];

    if (filters.type && filters.type !== 'all') {
      sql += ` AND type = ?`;
      params.push(filters.type);
    }
    if (filters.from) {
      sql += ` AND created_at >= ?`;
      params.push(filters.from);
    }
    if (filters.to) {
      sql += ` AND created_at <= ?`;
      params.push(filters.to);
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(Math.min(Number(filters.limit || 50), 100));

    return db.prepare(sql).all(...params);
  },

  get(id) {
    return db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(id);
  }
};

