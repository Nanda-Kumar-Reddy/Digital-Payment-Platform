export function maskMobile(mobile) {
  if (!mobile) return null;
  const last4 = mobile.slice(-4);
  return mobile.slice(0, 3) + '******' + last4;
}

export function maskAccountNumber(acc) {
  if (!acc) return null;
  return '****' + String(acc).slice(-4);
}

export function toPaise(amount) {
  if (typeof amount === 'number') {
    if (amount % 1 !== 0) return Math.round(amount * 100);
    return Math.round(amount);
  }
  if (typeof amount === 'string' && amount.includes('.')) return Math.round(parseFloat(amount) * 100);
  return Number(amount);
}
