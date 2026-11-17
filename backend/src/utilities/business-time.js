import { HttpError } from './http-error.js';

export function businessDate(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
}
export function businessDateRange(from, to) {
  const start = new Date(`${from}T00:00:00+07:00`);
  const end = new Date(new Date(`${to}T00:00:00+07:00`).getTime() + 86400000);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) throw new HttpError(400, 'INVALID_RANGE', 'Khoảng ngày không hợp lệ.');
  return { gte: start, lt: end };
}
