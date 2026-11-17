import { useState } from 'react';
import { Plus, Pencil, Power, Package } from 'lucide-react';
import { useAuth } from '../contexts/auth.js';
import { useToast } from '../contexts/toast.js';
import { useListQuery } from '../hooks/useListQuery.js';
import { useResource } from '../hooks/useResource.js';
import { api } from '../services/api.js';
import { money, number } from '../utilities/format.js';
import { PageHeading } from '../components/common/States.jsx';
import { DataTable, TableToolbar, ActiveFilter } from '../components/common/DataTable.jsx';
import { FormModal, ConfirmDialog } from '../components/common/FormModal.jsx';
import { Field } from '../components/common/Field.jsx';
import { Button } from '../components/ui/button.jsx';

const initialForm = {
  sku: '',
  name: '',
  categoryId: '',
  unit: 'Cái',
  price: '',
  description: '',
  lowStockThreshold: 10,
};

export function ProductsPage() {
  const { user } = useAuth();
  const manager = user.role === 'MANAGER';
  const notify = useToast();
  const query = useListQuery();
  const resource = useResource(`/products?${query.queryString}`);
  const categories = useResource(
    '/categories?pageSize=100&isActive=true&sortBy=name&sortOrder=asc',
    { allPages: true },
  );
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [confirming, setConfirming] = useState(null);
  function openEditor(product = {}) {
    setForm({ ...initialForm, ...product });
    setEditing(product);
  }
  async function save() {
    const data = {
      sku: form.sku,
      name: form.name,
      categoryId: form.categoryId,
      unit: form.unit,
      price: form.price,
      description: form.description,
      lowStockThreshold: Number(form.lowStockThreshold),
    };
    if (editing.id) await api.patch(`/products/${editing.id}`, data);
    else await api.post('/products', data);
    resource.reload();
    notify(
      editing.id ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm. Hãy nhập tồn tại trang Tồn kho.',
    );
  }
  async function toggle() {
    await api.patch(`/products/${confirming.id}`, { isActive: !confirming.isActive });
    resource.reload();
    notify('Đã cập nhật trạng thái sản phẩm.');
  }
  const columns = [
    {
      key: 'name',
      label: 'Sản phẩm',
      sortable: true,
      render: (row) => (
        <div className="product-cell">
          <span className="product-avatar">
            <Package size={21} />
          </span>
          <div>
            <strong>{row.name}</strong>
            <small>{row.sku}</small>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Danh mục',
      render: (row) => <span className="badge gray">{row.category.name}</span>,
    },
    {
      key: 'price',
      label: 'Giá bán',
      sortable: true,
      className: 'numeric',
      render: (row) => <strong>{money(row.price)}</strong>,
    },
    {
      key: 'stock',
      label: 'Tồn kho',
      sortable: true,
      className: 'numeric',
      render: (row) => (
        <span className={row.stock <= row.lowStockThreshold ? 'stock-low' : ''}>
          {number(row.stock)} <small>{row.unit}</small>
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Trạng thái',
      render: (row) => (
        <span className={`badge ${row.isActive && row.category.isActive ? 'green' : 'gray'}`}>
          {row.isActive && row.category.isActive ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
        </span>
      ),
    },
  ];
  if (manager)
    columns.push({
      key: 'actions',
      label: 'Thao tác',
      render: (row) => (
        <div className="row-actions">
          <button
            className="icon-button"
            aria-label={`Sửa ${row.name}`}
            onClick={() => openEditor(row)}
          >
            <Pencil size={16} />
          </button>
          <button
            className="icon-button"
            aria-label={`${row.isActive ? 'Ngừng' : 'Mở'} ${row.name}`}
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
        title={manager ? 'Sản phẩm' : 'Tra cứu sản phẩm'}
        description="Thông tin hàng hóa, giá bán và số lượng hiện có."
        action={
          manager && (
            <Button onClick={() => openEditor()}>
              <Plus size={17} />
              Thêm sản phẩm
            </Button>
          )
        }
      />
      <section className="panel">
        <div className="panel-title-row">
          <h2>Danh sách sản phẩm</h2>
          <span>{resource.data?.pagination?.total ?? '…'} sản phẩm</span>
        </div>
        <TableToolbar query={query} placeholder="Tìm tên sản phẩm hoặc mã SKU…">
          <select
            aria-label="Danh mục"
            value={query.get('categoryId')}
            onChange={(event) => query.update('categoryId', event.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {categories.data?.data.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
          {manager && <ActiveFilter query={query} />}
        </TableToolbar>
        <DataTable resource={resource} columns={columns} query={query} />
      </section>
      {editing && (
        <FormModal
          wide
          title={editing.id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}
          onClose={() => setEditing(null)}
          onSubmit={save}
        >
          {(errors) => (
            <>
              <div className="form-grid">
                <Field
                  label="Tên sản phẩm"
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  error={errors.name}
                />
                <Field
                  label="Mã SKU"
                  required
                  value={form.sku}
                  onChange={(event) => setForm({ ...form, sku: event.target.value })}
                  error={errors.sku}
                />
                <Field
                  label="Danh mục"
                  required
                  value={form.categoryId}
                  onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                  error={errors.categoryId}
                >
                  <option value="">Chọn danh mục</option>
                  {editing.category && !editing.category.isActive && (
                    <option value={editing.category.id}>
                      {editing.category.name} (Ngừng hoạt động)
                    </option>
                  )}
                  {categories.data?.data.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </Field>
                <Field
                  label="Đơn vị bán"
                  required
                  value={form.unit}
                  onChange={(event) => setForm({ ...form, unit: event.target.value })}
                  error={errors.unit}
                />
                <Field
                  label="Giá bán (VND)"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  required
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                  error={errors.price}
                />
                <Field
                  label="Ngưỡng tồn thấp"
                  type="number"
                  min="0"
                  required
                  value={form.lowStockThreshold}
                  onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })}
                  error={errors.lowStockThreshold}
                />
              </div>
              <Field
                label="Mô tả"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                error={errors.description}
              />
            </>
          )}
        </FormModal>
      )}
      {confirming && (
        <ConfirmDialog
          title={confirming.isActive ? 'Ngừng kinh doanh sản phẩm?' : 'Mở bán lại sản phẩm?'}
          description={confirming.name}
          onClose={() => setConfirming(null)}
          onConfirm={toggle}
        />
      )}
    </>
  );
}
