export function parseUpiUri(uri) {
  if (!uri || typeof uri !== 'string') return null;

  try {
    if (!uri.startsWith('upi://')) return null;
    const parts = uri.split('?');
    if (parts.length < 2) return null;
    const params = new URLSearchParams(parts[1]);
    const pa = params.get('pa');
    const am = params.get('am');
    const pn = params.get('pn') || params.get('tn');
    return { pa, am: am ? Math.round(parseFloat(am) * 100) : null, pn };
  } catch (e) {
    return null;
  }
}
