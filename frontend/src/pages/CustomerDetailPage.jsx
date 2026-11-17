import { useParams, Link } from 'react-router-dom';
import { ReceiptText, Wallet, CalendarDays, ArrowLeft } from 'lucide-react';
import { useResource } from '../hooks/useResource.js';
import { useListQuery } from '../hooks/useListQuery.js';
import { money, number, dateTime } from '../utilities/format.js';
import { PageHeading, Loading, ErrorState } from '../components/common/States.jsx';
import { TableToolbar } from '../components/common/DataTable.jsx';
import { InvoiceTable } from '../components/common/InvoiceTable.jsx';
import { StatCard } from '../components/common/StatCard.jsx';
import { Button } from '../components/ui/button.jsx';

export function CustomerDetailPage() {
  const { id } = useParams();
  const query = useListQuery('paidAt');
  const customer = useResource(`/customers/${id}`);
  const invoices = useResource(`/customers/${id}/invoices?${query.queryString}`);
  if (customer.loading) return <Loading />;
  if (customer.error) return <ErrorState message={customer.error} onRetry={customer.reload} />;
  const data = customer.data.data;
  return <><PageHeading title={data.name} description={[data.phone, data.email, data.address].filter(Boolean).join(' · ')} action={<Button asChild variant="outline"><Link to="/khach-hang"><ArrowLeft size={16} />Khách hàng</Link></Button>} /><div className="stats-grid three"><StatCard label="Tổng chi tiêu" value={money(data.summary.totalSpent)} icon={Wallet} /><StatCard label="Hóa đơn đã thanh toán" value={number(data.summary.invoiceCount)} icon={ReceiptText} tone="purple" /><StatCard label="Lần mua gần nhất" value={data.summary.lastPurchaseAt ? dateTime(data.summary.lastPurchaseAt) : 'Chưa phát sinh'} icon={CalendarDays} tone="amber" /></div><section className="panel"><div className="panel-title-row"><h2>Lịch sử mua hàng</h2></div><TableToolbar query={query} placeholder="Tìm mã hóa đơn…" /><InvoiceTable resource={invoices} query={query} hideCustomer /></section></>;
}
