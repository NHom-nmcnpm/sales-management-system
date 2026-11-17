import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, History, Package } from 'lucide-react';
import { useListQuery } from '../hooks/useListQuery.js';
import { useResource } from '../hooks/useResource.js';
import { useToast } from '../contexts/toast.js';
import { api } from '../services/api.js';
import { number, dateTime } from '../utilities/format.js';
import { PageHeading } from '../components/common/States.jsx';
import { DataTable, TableToolbar } from '../components/common/DataTable.jsx';
import { FormModal } from '../components/common/FormModal.jsx';
import { Field } from '../components/common/Field.jsx';
import { Button } from '../components/ui/button.jsx';

export function InventoryPage({ movements = false }) {
  const query = useListQuery();
  const resource = useResource(`/inventory${movements ? '/movements' : ''}?${query.queryString}`);
  const notify = useToast();
  const [adjusting, setAdjusting] = useState(null);
  const [form, setForm] = useState({ delta: '', reason: '' });
  const [operationKey, setOperationKey] = useState('');
  function adjust(row) { setForm({ delta: '', reason: '' }); setOperationKey(crypto.randomUUID()); setAdjusting(row); }
  async function save() {
    await api.post('/inventory/adjustments', { productId: adjusting.id, delta: Number(form.delta), reason: form.reason }, { headers: { 'Idempotency-Key': operationKey } });
    resource.reload(); notify('Đã điều chỉnh tồn kho và ghi nhận lịch sử.');
  }
  const columns = movements ? [
    { key: 'createdAt', label: 'Thời gian', sortable: true, render: row => dateTime(row.createdAt) },
    { key: 'product', label: 'Sản phẩm', render: row => <div><strong>{row.product.name}</strong><small className="cell-subtitle">{row.product.sku}</small></div> },
    { key: 'kind', label: 'Loại', render: row => ({ OPENING: 'Tồn đầu kỳ', ADJUSTMENT: 'Điều chỉnh', SALE: 'Bán hàng' })[row.kind] },
    { key: 'delta', label: 'Biến động', sortable: true, className: 'numeric', render: row => <span className={row.delta >= 0 ? 'positive' : 'negative'}>{row.delta > 0 ? '+' : ''}{number(row.delta)}</span> },
    { key: 'quantityAfter', label: 'Tồn sau', sortable: true, className: 'numeric' },
    { key: 'reason', label: 'Lý do' }, { key: 'actor', label: 'Người thực hiện', render: row => row.actor.name }
  ] : [
    { key: 'name', label: 'Sản phẩm', sortable: true, render: row => <div className="product-cell"><span className="product-avatar"><Package size={21} /></span><div><strong>{row.name}</strong><small>{row.sku}</small></div></div> },
    { key: 'stock', label: 'Tồn hiện tại', sortable: true, className: 'numeric', render: row => <strong>{number(row.stock)} <small>{row.unit}</small></strong> },
    { key: 'lowStockThreshold', label: 'Ngưỡng cảnh báo', className: 'numeric' },
    { key: 'status', label: 'Tình trạng', render: row => <span className={`badge ${row.stock === 0 ? 'gray' : row.stock <= row.lowStockThreshold ? 'amber' : 'green'}`}>{row.stock === 0 ? 'Hết hàng' : row.stock <= row.lowStockThreshold ? 'Sắp hết hàng' : 'Còn hàng'}</span> },
    { key: 'actions', label: 'Thao tác', render: row => <div className="row-actions"><Button size="sm" variant="outline" onClick={() => adjust(row)}><SlidersHorizontal size={14} />Điều chỉnh</Button><Button asChild size="icon" variant="ghost"><Link to={`/ton-kho/lich-su?productId=${row.id}`} aria-label={`Lịch sử ${row.name}`}><History size={17} /></Link></Button></div> }
  ];
  return <><PageHeading title={movements ? 'Lịch sử tồn kho' : 'Tồn kho'} description={movements ? 'Đối chiếu mọi lần nhập, điều chỉnh và bán hàng.' : 'Theo dõi số lượng hiện có và bổ sung hàng hóa kịp thời.'} action={<Button asChild variant="outline"><Link to={movements ? '/ton-kho' : '/ton-kho/lich-su'}><History size={16} />{movements ? 'Về tồn kho' : 'Lịch sử biến động'}</Link></Button>} />
    <section className="panel"><TableToolbar query={query} placeholder="Tìm tên, SKU hoặc lý do…">{!movements && <select aria-label="Tình trạng tồn" value={query.get('stockStatus')} onChange={event => query.update('stockStatus', event.target.value)}><option value="">Tất cả tồn kho</option><option value="low">Sắp hết hàng</option><option value="out">Hết hàng</option><option value="available">Còn nhiều hàng</option></select>}</TableToolbar><DataTable resource={resource} columns={columns} query={query} /></section>
    {adjusting && <FormModal title="Điều chỉnh tồn kho" description={`${adjusting.name} · Hiện có ${adjusting.stock} ${adjusting.unit}`} onClose={() => setAdjusting(null)} onSubmit={save} submitLabel="Xác nhận điều chỉnh">{errors => <><Field label="Số lượng điều chỉnh" type="number" required value={form.delta} onChange={event => setForm({ ...form, delta: event.target.value })} error={errors.delta} hint="Nhập số dương để tăng tồn, số âm để giảm tồn." /><Field label="Lý do điều chỉnh" required value={form.reason} onChange={event => setForm({ ...form, reason: event.target.value })} error={errors.reason} /><div className="info-strip">Tồn sau điều chỉnh dự kiến <strong>{number(adjusting.stock + Number(form.delta))} {adjusting.unit}</strong></div></>}</FormModal>}
  </>;
}
