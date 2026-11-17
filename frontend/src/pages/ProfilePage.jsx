import { useState } from 'react';
import { UserRound, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/auth.js';
import { useToast } from '../contexts/toast.js';
import { api } from '../services/api.js';
import { Field } from '../components/common/Field.jsx';
import { PageHeading } from '../components/common/States.jsx';
import { Button } from '../components/ui/button.jsx';

export function ProfilePage() {
  const { user, setUser, clearSession } = useAuth();
  const notify = useToast();
  const [name, setName] = useState(user.name);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState('');
  const [errors, setErrors] = useState({});
  async function saveProfile(event) {
    event.preventDefault(); setBusy('profile'); setErrors({});
    try { const { data } = await api.patch('/auth/profile', { name }); setUser(data.data); notify('Đã cập nhật hồ sơ.'); }
    catch (error) { setErrors(error.response?.data?.fieldErrors ?? {}); notify(error.message, 'error'); }
    finally { setBusy(''); }
  }
  async function changePassword(event) {
    event.preventDefault(); setBusy('password'); setErrors({});
    try { await api.post('/auth/change-password', passwords); clearSession(); notify('Đã đổi mật khẩu. Vui lòng đăng nhập lại.'); }
    catch (error) { setErrors(error.response?.data?.fieldErrors ?? {}); notify(error.message, 'error'); }
    finally { setBusy(''); }
  }
  return <><PageHeading title="Hồ sơ cá nhân" description="Thông tin tài khoản và bảo mật của bạn." />
    <div className="profile-grid"><section className="panel profile-card"><span className="profile-avatar">{user.name.charAt(0)}</span><h2>{user.name}</h2><p>{user.email}</p><span className="badge blue"><ShieldCheck size={14} />{user.role === 'MANAGER' ? 'Quản lý' : 'Nhân viên'}</span></section>
      <div className="profile-forms"><section className="panel"><div className="panel-heading"><UserRound size={19} /><h2>Thông tin cá nhân</h2></div><form onSubmit={saveProfile} className="form-stack"><Field label="Họ và tên" required value={name} onChange={event => setName(event.target.value)} error={errors.name} /><Field label="Email" value={user.email} disabled /><div className="form-actions"><Button type="submit" disabled={!!busy}>{busy === 'profile' ? 'Đang lưu…' : 'Lưu thay đổi'}</Button></div></form></section>
      <section className="panel"><div className="panel-heading"><KeyRound size={19} /><h2>Đổi mật khẩu</h2></div><form onSubmit={changePassword} className="form-stack"><Field label="Mật khẩu hiện tại" type="password" autoComplete="current-password" required value={passwords.currentPassword} onChange={event => setPasswords({ ...passwords, currentPassword: event.target.value })} error={errors.currentPassword} /><Field label="Mật khẩu mới" type="password" autoComplete="new-password" required minLength={10} hint="Ít nhất 10 ký tự, tối đa 72 byte. Sau khi đổi, bạn cần đăng nhập lại." value={passwords.newPassword} onChange={event => setPasswords({ ...passwords, newPassword: event.target.value })} error={errors.newPassword} /><div className="form-actions"><Button type="submit" variant="outline" disabled={!!busy}>{busy === 'password' ? 'Đang xử lý…' : 'Đổi mật khẩu'}</Button></div></form></section></div>
    </div></>;
}
