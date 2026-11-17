import { useState } from 'react';
import { Plus, Pencil, Power, TicketPercent } from 'lucide-react';
import { useResource } from '../hooks/useResource.js';
import { useListQuery } from '../hooks/useListQuery.js';
import { useToast } from '../contexts/toast.js';
import { api } from '../services/api.js';
import { money, dateTime, vietnamDateTimeInput, vietnamInputToIso } from '../utilities/format.js';
import { PageHeading } from '../components/common/States.jsx';
import { DataTable, TableToolbar, ActiveFilter } from '../components/common/DataTable.jsx';
import { FormModal, ConfirmDialog } from '../components/common/FormModal.jsx';
import { Field } from '../components/common/Field.jsx';
import { Button } from '../components/ui/button.jsx';

export function PromotionsPage() {
  const query = useListQuery();
  const resource = useResource(`/promotions?${query.queryString}`);
  const notify = useToast();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [confirming, setConfirming] = useState(null);
  function edit(row = {}) {
    setForm({ code: row.code ?? '', name: row.name ?? '', discountType: row.discountType ?? 'PERCENT', discountValue: row.discountValue ?? '', minSubtotal: row.minSubtotal ?? '0', maxDiscount: row.maxDiscount ?? '', startsAt: vietnamDateTimeInput(row.startsAt ?? new Date()), endsAt: vietnamDateTimeInput(row.endsAt ?? new Date(Date.now() + 30 * 86400000)) });
    setEditing(row);
  }
  async function save() {
    const payload = { ...form, maxDiscount: form.maxDiscount || null, startsAt: vietnamInputToIso(form.startsAt), endsAt: vietnamInputToIso(form.endsAt) };
    if (editing.id) await api.patch(`/promotions/${editing.id}`, payload);
    else await api.post('/promotions', payload);
    resource.reload(); notify('Đã lưu chương trình khuyến mại.');
  }
  const columns = [
    { key: 'name', label: 'Chương trình', sortable: true, render: row => <div className="product-cell"><span className="product-avatar purple"><TicketPercent size={21} /></span><div><strong>{row.name}</strong><small>{row.code}</small></div></div> },
    { key: 'discount', label: 'Mức giảm', render: row => row.discountType === 'PERCENT' ? `${row.discountValue}%` : money(row.discountValue) },
    { key: 'minSubtotal', label: 'Đơn tối thiểu', className: 'numeric', render: row => money(row.minSubtotal) },
    { key: 'endsAt', label: 'Kết thúc', sortable: true, render: row => dateTime(row.endsAt) },
    { key: 'isActive', label: 'Trạng thái', render: row => <span className={`badge ${!row.isActive ? 'gray' : new Date(row.endsAt) <= new Date() ? 'amber' : 'green'}`}>{!row.isActive ? 'Đã tắt' : new Date(row.endsAt) <= new Date() ? 'Hết hạn' : new Date(row.startsAt) > new Date() ? 'Sắp bắt đầu' : 'Đang áp dụng'}</span> },
    { key: 'actions', label: 'Thao tác', render: row => <div className="row-actions"><button className="icon-button" aria-label={`Sửa ${row.name}`} onClick={() => edit(row)}><Pencil size={16} /></button><button className="icon-button" aria-label={`Đổi trạng thái ${row.name}`} onClick={() => setConfirming(row)}><Power size={16} /></button></div> }
  ];
  return <><PageHeading title="Khuyến mại" description="Thiết lập ưu đãi toàn hóa đơn và điều kiện áp dụng." action={<Button onClick={() => edit()}><Plus size={17} />Thêm khuyến mại</Button>} /><section className="panel"><TableToolbar query={query} placeholder="Tìm chương trình hoặc mã ưu đãi…"><ActiveFilter query={query} /></TableToolbar><DataTable resource={resource} columns={columns} query={query} /></section>
    {editing && <FormModal wide title={editing.id ? 'Chỉnh sửa khuyến mại' : 'Thêm khuyến mại'} description="Thời gian áp dụng theo giờ Việt Nam. Mỗi hóa đơn chọn tối đa một chương trình." onClose={() => setEditing(null)} onSubmit={save}>{errors => <div className="form-grid"><Field label="Tên chương trình" required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} error={errors.name} /><Field label="Mã ưu đãi" required value={form.code} onChange={event => setForm({ ...form, code: event.target.value })} error={errors.code} /><Field label="Hình thức giảm" value={form.discountType} onChange={event => setForm({ ...form, discountType: event.target.value })}><option value="PERCENT">Phần trăm (%)</option><option value="FIXED">Số tiền (VND)</option></Field><Field label="Giá trị giảm" required type="number" min="0.01" step={form.discountType === 'PERCENT' ? '0.01' : '1'} value={form.discountValue} onChange={event => setForm({ ...form, discountValue: event.target.value })} error={errors.discountValue} /><Field label="Giá trị đơn tối thiểu (VND)" inputMode="numeric" required value={form.minSubtotal} onChange={event => setForm({ ...form, minSubtotal: event.target.value })} error={errors.minSubtotal} /><Field label="Giảm tối đa (VND)" inputMode="numeric" value={form.maxDiscount} onChange={event => setForm({ ...form, maxDiscount: event.target.value })} error={errors.maxDiscount} hint="Để trống nếu không giới hạn." /><Field label="Bắt đầu" type="datetime-local" required value={form.startsAt} onChange={event => setForm({ ...form, startsAt: event.target.value })} error={errors.startsAt} /><Field label="Kết thúc" type="datetime-local" required value={form.endsAt} onChange={event => setForm({ ...form, endsAt: event.target.value })} error={errors.endsAt} /></div>}</FormModal>}
    {confirming && <ConfirmDialog title="Thay đổi trạng thái khuyến mại?" description={confirming.name} onClose={() => setConfirming(null)} onConfirm={async () => { await api.patch(`/promotions/${confirming.id}`, { isActive: !confirming.isActive }); resource.reload(); notify('Đã cập nhật khuyến mại.'); }} />}
  </>;
}
