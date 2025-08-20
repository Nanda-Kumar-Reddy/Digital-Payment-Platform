import crypto from 'crypto';
import { db } from '../config/database.js';

export const idempotency = (endpointName) => (req, res, next) => {
  const key = req.headers['idempotency-key'];
  if (!key) {
    return res.status(400).json({ success: false, error: { code: 'IDEMPOTENCY_REQUIRED', message: 'Idempotency-Key header required' } });
  }
  const requestHash = crypto.createHash('sha256').update(JSON.stringify(req.body || {})).digest('hex');
  const existing = db.prepare('SELECT response_json, status_code FROM idempotency_keys WHERE user_id=? AND endpoint=? AND id=?').get(req.user.id, endpointName, key);
  if (existing) {
    res.status(existing.status_code || 200);
    res.type('application/json').send(existing.response_json || '{}');
    return;
  }
  // store placeholder
  db.prepare(`
  INSERT OR IGNORE INTO idempotency_keys 
  (id, user_id, endpoint, request_hash, created_at) 
  VALUES (?, ?, ?, ?, datetime('now'))
`).run(key, req.user.id, endpointName, requestHash);


  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    try {
      db.prepare('UPDATE idempotency_keys SET response_json = ?, status_code = ? WHERE id = ? AND user_id = ? AND endpoint = ?')
        .run(JSON.stringify(payload), res.statusCode || 200, key, req.user.id, endpointName);
    } catch (e) {

    }
    return originalJson(payload);
  };
  next();
};
