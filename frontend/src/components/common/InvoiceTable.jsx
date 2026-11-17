import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { DataTable } from './DataTable.jsx';
import { money, dateTime, invoiceCode } from '../../utilities/format.js';

export function InvoiceTable({ resource, query, hideCustomer = false }) {
  const columns = [
    {
      key: 'number',
      label: 'Mã hóa đơn',
      sortable: true,
      render: (row) => (
        <Link className="text-link inline-link" to={`/hoa-don/${row.id}`}>
          {invoiceCode(row.number)}
          <ArrowUpRight size={13} />
        </Link>
      ),
    },
    { key: 'paidAt', label: 'Thời gian', sortable: true, render: (row) => dateTime(row.paidAt) },
    { key: 'customer', label: 'Khách hàng', render: (row) => row.customerSnapshot.name },
    { key: 'employee', label: 'Người lập', render: (row) => row.createdBy.name },
    {
      key: 'method',
      label: 'Thanh toán',
      render: (row) => (
        <span className="badge gray">
          {row.payment.method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
        </span>
      ),
    },
    {
      key: 'total',
      label: 'Tổng tiền',
      sortable: true,
      className: 'numeric',
      render: (row) => <strong>{money(row.total)}</strong>,
    },
  ];
  return (
    <DataTable
      resource={resource}
      query={query}
      columns={hideCustomer ? columns.filter((column) => column.key !== 'customer') : columns}
      emptyTitle="Chưa có hóa đơn"
      emptyDescription="Các giao dịch phù hợp sẽ xuất hiện tại đây."
    />
  );
}
