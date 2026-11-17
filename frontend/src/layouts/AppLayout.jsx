import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Store, UserRound, LogOut, Menu, X, ChevronRight, ShieldCheck, Package, Folders, Warehouse, UsersRound, ContactRound, TicketPercent } from 'lucide-react';
import { useAuth } from '../contexts/auth.js';
import { useToast } from '../contexts/toast.js';
import { Button } from '../components/ui/button.jsx';

const navigation = [
  { to: '/san-pham', label: 'Sản phẩm', icon: Package },
  { to: '/danh-muc', label: 'Danh mục', icon: Folders, manager: true },
  { to: '/ton-kho', label: 'Tồn kho', icon: Warehouse, manager: true },
  { to: '/khach-hang', label: 'Khách hàng', icon: ContactRound },
  { to: '/khuyen-mai', label: 'Khuyến mại', icon: TicketPercent, manager: true },
  { to: '/nhan-vien', label: 'Nhân viên', icon: UsersRound, manager: true },
  { to: '/ho-so', label: 'Hồ sơ cá nhân', icon: UserRound }
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const notify = useToast();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = navigation.find(item => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
  const roleLabel = user.role === 'MANAGER' ? 'Quản lý cửa hàng' : 'Nhân viên bán hàng';
  async function handleLogout() {
    try { await logout(); } catch (error) { notify(error.message, 'error'); }
  }
  return <div className="app-shell">
    <a href="#main-content" className="skip-link">Đến nội dung chính</a>
    {menuOpen && <button className="sidebar-scrim" onClick={() => setMenuOpen(false)} aria-label="Đóng menu" />}
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Điều hướng chính">
      <Link to="/" className="brand"><span className="brand-icon"><Store size={23} aria-hidden="true" /></span><span>Sổ Bán Hàng<small>QUẢN LÝ CỬA HÀNG</small></span></Link>
      <button className="mobile-close icon-button" onClick={() => setMenuOpen(false)} aria-label="Đóng menu"><X size={20} /></button>
      <div className="store-switch"><span className="store-avatar">VP</span><div><strong>Cửa hàng Văn Phòng</strong><span>Cửa hàng chính</span></div><ShieldCheck size={16} aria-hidden="true" /></div>
      <p className="nav-label">KHÔNG GIAN LÀM VIỆC</p>
      <nav>{navigation.filter(item => !item.manager || user.role === 'MANAGER').map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={19} aria-hidden="true" /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="avatar">{user.name.charAt(0)}</div><div className="sidebar-user"><strong>{user.name}</strong><span>{roleLabel}</span></div><button className="icon-button" onClick={handleLogout} aria-label="Đăng xuất"><LogOut size={18} /></button></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumbs"><button className="mobile-menu icon-button" onClick={() => setMenuOpen(true)} aria-label="Mở menu" aria-expanded={menuOpen}><Menu size={21} /></button><span>Cửa hàng</span><ChevronRight size={14} aria-hidden="true" /><strong>{current?.label ?? 'Chi tiết'}</strong></div><div className="topbar-user"><span className="role-pill">{roleLabel}</span><Button asChild variant="ghost" size="icon"><Link to="/ho-so" aria-label="Hồ sơ cá nhân"><UserRound size={20} /></Link></Button></div></header>
      <main id="main-content" className="page-content"><Outlet /></main>
      <footer className="app-footer"><span>Sổ Bán Hàng</span><span>Đơn vị tiền tệ VND · Giờ Việt Nam</span></footer>
    </div>
  </div>;
}
