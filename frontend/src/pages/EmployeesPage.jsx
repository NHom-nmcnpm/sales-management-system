import { useState } from 'react';
import { Plus, Pencil, Power, KeyRound } from 'lucide-react';
import { useResource } from '../hooks/useResource.js';
import { useListQuery } from '../hooks/useListQuery.js';
import { useToast } from '../contexts/toast.js';
import { api } from '../services/api.js';
import { dateTime } from '../utilities/format.js';
import { PageHeading } from '../components/common/States.jsx';
import { DataTable, TableToolbar, ActiveFilter } from '../components/common/DataTable.jsx';
import { FormModal, ConfirmDialog } from '../components/common/FormModal.jsx';
import { Field } from '../components/common/Field.jsx';
import { Button } from '../components/ui/button.jsx';

export function EmployeesPage() {
  const query = useListQuery();
  const resource = useResource(`/employees?${query.queryString}`);
  const notify = useToast();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [confirming, setConfirming] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  function edit(row = {}) { setForm({ name: row.name ?? '', email: row.email ?? '', password: '' }); setEditing(row); }
  async function save() {
    if (editing.id) await api.patch(`/employees/${editing.id}`, { name: form.name, email: form.email });
    else await api.post('/employees', form);
    resource.reload(); notify('Đã lưu thông tin nhân viên.');
  }
  const columns = [
    { key: 'name', label: 'Nhân viên', sortable: true, render: row => <div className="product-cell"><span className="avatar">{row.name.charAt(0)}</span><strong>{row.name}</strong></div> },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'createdAt', label: 'Ngày tạo', sortable: true, render: row => dateTime(row.createdAt) },
    { key: 'isActive', label: 'Trạng thái', render: row => <span className={`badge ${row.isActive ? 'green' : 'gray'}`}>{row.isActive ? 'Đang hoạt động' : 'Đã khóa'}</span> },
    { key: 'actions', label: 'Thao tác', render: row => <div className="row-actions"><button className="icon-button" aria-label={`Sửa ${row.name}`} onClick={() => edit(row)}><Pencil size={16} /></button><button className="icon-button" aria-label={`Đặt lại mật khẩu ${row.name}`} onClick={() => { setResetting(row); setNewPassword(''); }}><KeyRound size={16} /></button><button className="icon-button" aria-label={`Đổi trạng thái ${row.name}`} onClick={() => setConfirming(row)}><Power size={16} /></button></div> }
  ];
  return <><PageHeading title="Nhân viên" description="Quản lý tài khoản và quyền truy cập của đội ngũ bán hàng." action={<Button onClick={() => edit()}><Plus size={17} />Thêm nhân viên</Button>} /><section className="panel"><TableToolbar query={query} placeholder="Tìm họ tên hoặc email…"><ActiveFilter query={query} /></TableToolbar><DataTable resource={resource} columns={columns} query={query} /></section>
    {editing && <FormModal title={editing.id ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên'} onClose={() => setEditing(null)} onSubmit={save}>{errors => <><Field label="Họ và tên" required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} error={errors.name} /><Field label="Email" type="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} error={errors.email} />{!editing.id && <Field label="Mật khẩu ban đầu" type="password" autoComplete="new-password" minLength={10} required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} error={errors.password} hint="Ít nhất 10 ký tự, tối đa 72 byte." />}</>}</FormModal>}
    {confirming && <ConfirmDialog title={confirming.isActive ? 'Khóa tài khoản nhân viên?' : 'Mở khóa tài khoản?'} description={confirming.isActive ? 'Các phiên đăng nhập hiện tại sẽ kết thúc ngay.' : confirming.name} onClose={() => setConfirming(null)} onConfirm={async () => { await api.patch(`/employees/${confirming.id}`, { isActive: !confirming.isActive }); resource.reload(); notify('Đã cập nhật trạng thái tài khoản.'); }} />}
    {resetting && <FormModal title="Đặt lại mật khẩu" description={`Các phiên của ${resetting.name} sẽ bị thu hồi.`} onClose={() => setResetting(null)} onSubmit={async () => { await api.post(`/employees/${resetting.id}/reset-password`, { password: newPassword }); notify('Đã đặt lại mật khẩu.'); }} submitLabel="Xác nhận đặt lại">{errors => <Field label="Mật khẩu mới" type="password" autoComplete="new-password" required minLength={10} value={newPassword} onChange={event => setNewPassword(event.target.value)} error={errors.password} />}</FormModal>}
  </>;
}
