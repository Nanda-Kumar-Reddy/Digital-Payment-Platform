export function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (res.headersSent) return;
  const status = err && err.status ? err.status : 500;
  const code = err && err.code ? err.code : status === 500 ? 'INTERNAL_ERROR' : 'ERROR';
  res.status(status).json({ success: false, error: { code, message: err.message || 'Internal server error' } });
}
