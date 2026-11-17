import { useState } from 'react';
import { FormModal } from './FormModal.jsx';
import { Field } from './Field.jsx';
import { api } from '../../services/api.js';

export function CustomerForm({ customer = {}, onClose, onSaved }) {
  const [form, setForm] = useState({ name: customer.name ?? '', phone: customer.phone ?? '', email: customer.email ?? '', address: customer.address ?? '' });
  async function save() {
    const payload = { ...form, phone: form.phone || null, email: form.email || null };
    const response = customer.id ? await api.patch(`/customers/${customer.id}`, payload) : await api.post('/customers', payload);
    onSaved(response.data.data);
  }
  return <FormModal title={customer.id ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng'} onClose={onClose} onSubmit={save}>{errors => <><Field label="Tên khách hàng" required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} error={errors.name} /><Field label="Số điện thoại" type="tel" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} error={errors.phone} /><Field label="Email" type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} error={errors.email} /><Field label="Địa chỉ" value={form.address} onChange={event => setForm({ ...form, address: event.target.value })} error={errors.address} /></>}</FormModal>;
}
