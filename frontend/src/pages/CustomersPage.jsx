import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Power } from 'lucide-react';
import { useAuth } from '../contexts/auth.js';
import { useToast } from '../contexts/toast.js';
import { useResource } from '../hooks/useResource.js';
import { useListQuery } from '../hooks/useListQuery.js';
import { api } from '../services/api.js';
import { PageHeading } from '../components/common/States.jsx';
import { DataTable, TableToolbar, ActiveFilter } from '../components/common/DataTable.jsx';
import { CustomerForm } from '../components/common/CustomerForm.jsx';
import { ConfirmDialog } from '../components/common/FormModal.jsx';
import { Button } from '../components/ui/button.jsx';

export function CustomersPage() {
  const { user } = useAuth();
  const manager = user.role === 'MANAGER';
  const query = useListQuery();
  const resource = useResource(`/customers?${query.queryString}`);
  const notify = useToast();
  const [editing, setEditing] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const columns = [
    {
      key: 'name',
      label: 'Khách hàng',
      sortable: true,
      render: (row) => (
        <div className="product-cell">
          <span className="avatar">{row.name.charAt(0)}</span>
          {manager ? (
            <Link className="text-link inline-link" to={`/khach-hang/${row.id}`}>
              {row.name}
            </Link>
          ) : (
            <strong>{row.name}</strong>
          )}
        </div>
      ),
    },
    { key: 'phone', label: 'Điện thoại', sortable: true, render: (row) => row.phone || '—' },
    { key: 'email', label: 'Email', render: (row) => row.email || '—' },
    { key: 'address', label: 'Địa chỉ', render: (row) => row.address || '—' },
  ];
  if (manager)
    columns.push({
      key: 'actions',
      label: 'Thao tác',
      render: (row) => (
        <div className="row-actions">
          <span className={`badge ${row.isActive ? 'green' : 'gray'}`}>
            {row.isActive ? 'Hoạt động' : 'Đã ngừng'}
          </span>
          <button
            className="icon-button"
            aria-label={`Sửa ${row.name}`}
            onClick={() => setEditing(row)}
          >
            <Pencil size={16} />
          </button>
          <button
            className="icon-button"
            aria-label={`Đổi trạng thái ${row.name}`}
            onClick={() => setConfirming(row)}
          >
            <Power size={16} />
          </button>
        </div>
      ),
    });
  return (
    <>
      <PageHeading
        title="Khách hàng"
        description="Thông tin liên hệ để chăm sóc và phục vụ khách hàng."
        action={
          <Button onClick={() => setEditing({})}>
            <Plus size={17} />
            Thêm khách hàng
          </Button>
        }
      />
      <section className="panel">
        <TableToolbar query={query} placeholder="Tìm tên hoặc số điện thoại…">
          {manager && <ActiveFilter query={query} />}
        </TableToolbar>
        <DataTable resource={resource} columns={columns} query={query} />
      </section>
      {editing && (
        <CustomerForm
          customer={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            resource.reload();
            notify('Đã lưu khách hàng.');
          }}
        />
      )}
      {confirming && (
        <ConfirmDialog
          title="Thay đổi trạng thái khách hàng?"
          description="Thông tin giao dịch trước đây được lưu trong hóa đơn."
          onClose={() => setConfirming(null)}
          onConfirm={async () => {
            await api.patch(`/customers/${confirming.id}`, { isActive: !confirming.isActive });
            resource.reload();
            notify('Đã cập nhật trạng thái khách hàng.');
          }}
        />
      )}
    </>
  );
}
