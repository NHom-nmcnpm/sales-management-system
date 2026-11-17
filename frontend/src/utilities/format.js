const moneyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
export function money(value = '0') { return moneyFormatter.format(BigInt(String(value).split('.')[0])); }
export function number(value = 0) { return new Intl.NumberFormat('vi-VN').format(value); }
export function dateTime(value) { return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)); }
export function invoiceCode(value) { return `HD-${String(value).padStart(6, '0')}`; }
