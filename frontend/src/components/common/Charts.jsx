import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { money, number, periodLabel } from '../../utilities/format.js';
import { EmptyState } from './States.jsx';

const compactNumber = value => new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

export function RevenueChart({ report }) {
  if (!report.data.length) return <EmptyState />;
  const rows = report.data.map(row => ({ ...row, numericRevenue: Number(row.revenue) }));
  return <div className="chart-container" role="img" aria-label="Biểu đồ doanh thu theo thời gian. Dữ liệu chi tiết có trong bảng doanh thu."><ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ top: 12, right: 15, left: -15, bottom: 5 }} accessibilityLayer><CartesianGrid stroke="#eef2f7" vertical={false} /><XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={value => periodLabel(value, report.groupBy)} minTickGap={30} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={compactNumber} width={75} /><Tooltip formatter={(_value, _name, item) => [money(item.payload.revenue), 'Doanh thu']} labelFormatter={value => periodLabel(value, report.groupBy)} contentStyle={{ borderRadius: 10, fontSize: 12, borderColor: '#e2e8f0' }} /><Line type="monotone" dataKey="numericRevenue" stroke="#1d4ed8" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>;
}

export function ProductChart({ rows }) {
  if (!rows.length) return <EmptyState title="Chưa có sản phẩm bán ra" description="Sản phẩm bán chạy sẽ xuất hiện sau giao dịch." />;
  return <div className="chart-container" role="img" aria-label="Biểu đồ số lượng sản phẩm bán chạy."><ResponsiveContainer width="100%" height="100%"><BarChart data={rows.map(row => ({ ...row, numericQuantity: Number(row.quantity) }))} layout="vertical" margin={{ top: 8, right: 25, bottom: 8, left: 0 }} accessibilityLayer><CartesianGrid stroke="#eef2f7" horizontal={false} /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} /><YAxis type="category" dataKey="name" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={value => value.length > 19 ? `${value.slice(0, 18)}…` : value} /><Tooltip formatter={(_value, _name, item) => [number(item.payload.quantity), 'Đã bán']} contentStyle={{ borderRadius: 10, fontSize: 12, borderColor: '#e2e8f0' }} /><Bar dataKey="numericQuantity" fill="#1d4ed8" radius={[0, 5, 5, 0]} maxBarSize={24} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>;
}
