import { useState } from 'react';
import { Plus, Pencil, Power, FolderOpen } from 'lucide-react';
import { useListQuery } from '../hooks/useListQuery.js';
import { useResource } from '../hooks/useResource.js';
import { useToast } from '../contexts/toast.js';
import { api } from '../services/api.js';
import { PageHeading } from '../components/common/States.jsx';
import { DataTable, TableToolbar, ActiveFilter } from '../components/common/DataTable.jsx';
import { FormModal, ConfirmDialog } from '../components/common/FormModal.jsx';
import { Field } from '../components/common/Field.jsx';
import { Button } from '../components/ui/button.jsx';

export function CategoriesPage() {
  const query = useListQuery('name');
  const resource = useResource(`/categories?${query.queryString}`);
  const notify = useToast();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [confirming, setConfirming] = useState(null);
  function edit(row = {}) { setForm({ name: row.name ?? '', description: row.description ?? '' }); setEditing(row); }
  async function save() {
    if (editing.id) await api.patch(`/categories/${editing.id}`, form);
    else await api.post('/categories', form);
    resource.reload(); notify('Đã lưu danh mục.');
  }
  const columns = [
    { key: 'name', label: 'Tên danh mục', sortable: true, render: row => <div className="product-cell"><span className="product-avatar"><FolderOpen size={20} /></span><strong>{row.name}</strong></div> },
    { key: 'description', label: 'Mô tả', render: row => row.description || '—' },
    { key: 'count', label: 'Số sản phẩm', className: 'numeric', render: row => row._count.products },
    { key: 'isActive', label: 'Trạng thái', render: row => <span className={`badge ${row.isActive ? 'green' : 'gray'}`}>{row.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span> },
    { key: 'actions', label: 'Thao tác', render: row => <div className="row-actions"><button className="icon-button" aria-label={`Sửa ${row.name}`} onClick={() => edit(row)}><Pencil size={16} /></button><button className="icon-button" aria-label={`Đổi trạng thái ${row.name}`} onClick={() => setConfirming(row)}><Power size={16} /></button></div> }
  ];
  return <><PageHeading title="Danh mục sản phẩm" description="Sắp xếp hàng hóa theo nhóm để tìm kiếm và bán hàng nhanh hơn." action={<Button onClick={() => edit()}><Plus size={17} />Thêm danh mục</Button>} /><section className="panel"><TableToolbar query={query} placeholder="Tìm tên danh mục…"><ActiveFilter query={query} /></TableToolbar><DataTable resource={resource} columns={columns} query={query} /></section>
    {editing && <FormModal title={editing.id ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'} onClose={() => setEditing(null)} onSubmit={save}>{errors => <><Field label="Tên danh mục" required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} error={errors.name} /><Field label="Mô tả" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} error={errors.description} /></>}</FormModal>}
    {confirming && <ConfirmDialog title="Thay đổi trạng thái danh mục?" description={confirming.isActive ? 'Các sản phẩm trong danh mục sẽ tạm ngừng bán khi danh mục ngừng hoạt động.' : 'Danh mục sẽ được mở hoạt động trở lại.'} onClose={() => setConfirming(null)} onConfirm={async () => { await api.patch(`/categories/${confirming.id}`, { isActive: !confirming.isActive }); resource.reload(); notify('Đã cập nhật trạng thái danh mục.'); }} />}
  </>;
}
