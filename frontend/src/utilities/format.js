const moneyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
export function money(value = '0') { return moneyFormatter.format(BigInt(String(value).split('.')[0])); }
export function number(value = 0) { return new Intl.NumberFormat('vi-VN').format(typeof value === 'string' ? BigInt(value) : value); }
export function dateTime(value) { return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)); }
export function invoiceCode(value) { return `HD-${String(value).padStart(6, '0')}`; }
export function vietnamDateTimeInput(value = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value)).replace(' ', 'T');
}
export function vietnamInputToIso(value) { return new Date(`${value}:00+07:00`).toISOString(); }
export function todayVietnam() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
export function periodLabel(period, groupBy = 'day') {
  if (groupBy === 'year') return period.slice(0, 4);
  if (groupBy === 'month') return `${period.slice(5, 7)}/${period.slice(0, 4)}`;
  return `${period.slice(8, 10)}/${period.slice(5, 7)}`;
}
