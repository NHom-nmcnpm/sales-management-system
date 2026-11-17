import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Store,
  ShieldCheck,
  Eye,
  EyeOff,
  Package,
  ReceiptText,
  ChartNoAxesCombined,
} from 'lucide-react';
import { useAuth } from '../contexts/auth.js';
import { Field } from '../components/common/Field.jsx';
import { Button } from '../components/ui/button.jsx';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (user) return <Navigate to="/" replace />;
  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login({ email: email.trim(), password });
      navigate('/', { replace: true });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <section className="login-story">
        <div className="brand light">
          <span className="brand-icon">
            <Store size={25} />
          </span>
          <span>
            Sổ Bán Hàng<small>QUẢN LÝ CỬA HÀNG</small>
          </span>
        </div>
        <div className="login-copy">
          <span className="eyebrow">KHÔNG GIAN LÀM VIỆC CỦA BẠN</span>
          <h1>
            Quản lý cửa hàng
            <br />
            mỗi ngày.
          </h1>
          <p>Theo dõi bán hàng, hàng hóa và doanh thu cửa hàng trong một không gian thống nhất.</p>
          <div className="login-features">
            <span>
              <Package size={20} />
              Hàng hóa & tồn kho
            </span>
            <span>
              <ReceiptText size={20} />
              Bán hàng & hóa đơn
            </span>
            <span>
              <ChartNoAxesCombined size={20} />
              Doanh thu & báo cáo
            </span>
          </div>
        </div>
        <div className="login-bottom">
          <ShieldCheck size={18} />
          Phân quyền theo vai trò, bảo vệ dữ liệu cửa hàng.
        </div>
      </section>
      <section className="login-form-section">
        <form className="login-form" onSubmit={handleSubmit}>
          <span className="eyebrow">CHÀO MỪNG TRỞ LẠI</span>
          <h2>Đăng nhập</h2>
          <p>Sử dụng tài khoản được cấp để bắt đầu ca làm việc.</p>
          {error && (
            <div className="form-alert" role="alert">
              {error}
            </div>
          )}
          <Field
            label="Email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ten@cuahang.vn"
          />
          <div className="password-field">
            <Field
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu của bạn"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <Button type="submit" disabled={busy} className="w-full min-h-12 mt-2">
            {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
            <ArrowRight size={18} />
          </Button>
          <p className="login-help">Cần hỗ trợ tài khoản? Liên hệ quản lý cửa hàng.</p>
        </form>
        <span className="login-copyright">Sổ Bán Hàng · Hệ thống quản lý cửa hàng</span>
      </section>
    </div>
  );
}
