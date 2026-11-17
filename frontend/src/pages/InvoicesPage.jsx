import { useAuth } from '../contexts/auth.js';
import { useListQuery } from '../hooks/useListQuery.js';
import { useResource } from '../hooks/useResource.js';
import { PageHeading } from '../components/common/States.jsx';
import { TableToolbar } from '../components/common/DataTable.jsx';
import { InvoiceTable } from '../components/common/InvoiceTable.jsx';

export function InvoicesPage() {
  const { user } = useAuth();
  const query = useListQuery('paidAt');
  const resource = useResource(`/invoices?${query.queryString}`);
  return (
    <>
      <PageHeading
        title={user.role === 'MANAGER' ? 'Hóa đơn' : 'Giao dịch của tôi'}
        description={
          user.role === 'MANAGER'
            ? 'Tra cứu hóa đơn và giao dịch toàn cửa hàng.'
            : 'Tra cứu các hóa đơn bạn đã lập trong quá trình bán hàng.'
        }
      />
      <section className="panel">
        <TableToolbar query={query} placeholder="Tìm mã hóa đơn, khách hoặc người lập…">
          <label className="date-filter">
            Từ ngày
            <input
              aria-label="Từ ngày"
              type="date"
              value={query.get('from')}
              onChange={(event) => query.update('from', event.target.value)}
            />
          </label>
          <label className="date-filter">
            Đến ngày
            <input
              aria-label="Đến ngày"
              type="date"
              value={query.get('to')}
              onChange={(event) => query.update('to', event.target.value)}
            />
          </label>
          <select
            aria-label="Hình thức thanh toán"
            value={query.get('method')}
            onChange={(event) => query.update('method', event.target.value)}
          >
            <option value="">Mọi hình thức</option>
            <option value="CASH">Tiền mặt</option>
            <option value="BANK_TRANSFER">Chuyển khoản</option>
          </select>
        </TableToolbar>
        <InvoiceTable resource={resource} query={query} />
      </section>
    </>
  );
}
