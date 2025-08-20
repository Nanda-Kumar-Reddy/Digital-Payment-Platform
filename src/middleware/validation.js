export function requireFields(obj, fields) {
  const missing = [];
  for (const f of fields) {
    if (obj[f] === undefined || obj[f] === null || obj[f] === '') missing.push(f);
  }
  return missing;
}

export function validateBody(requiredFields) {
  return (req, res, next) => {
    const missing = requireFields(req.body || {}, requiredFields);
    if (missing.length) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `Missing fields: ${missing.join(', ')}` } });
    }
    next();
  };
}
