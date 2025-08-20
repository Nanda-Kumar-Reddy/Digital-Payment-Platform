import { db } from '../config/database.js';
import QRCode from 'qrcode';

export const registerMerchant = (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name required' } });
  const upiCollectId = `${name.toLowerCase().replace(/\s+/g, '')}@collect`;
  db.prepare("INSERT INTO merchants (user_id, name, upi_collect_id, created_at) VALUES (?, ?, ?, datetime('now'))").run(req.user.id, name, upiCollectId);
  res.json({ success: true, merchant: { name, upiCollectId } });
};

export const generateQR = async (req, res) => {
  const m = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(req.user.id);
  if (!m) return res.status(403).json({ success: false, error: { code: 'NOT_MERCHANT', message: 'Register as merchant' } });
  const params = new URLSearchParams({ pa: m.upi_collect_id, pn: m.name });
  if (req.body?.amount) params.set('am', (Number(req.body.amount) / 100).toString());
  if (req.body?.description) params.set('tn', req.body.description);
  const uri = `upi://pay?${params.toString()}`;
  const dataUrl = await QRCode.toDataURL(uri);
  res.json({ success: true, upiUri: uri, qr: dataUrl });
};

export const settlements = (req, res) => {
  res.json({ success: true, settlements: [] });
};
