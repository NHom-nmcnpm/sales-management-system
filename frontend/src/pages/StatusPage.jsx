import { Link } from 'react-router-dom';
import { ShieldAlert, SearchX } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';

export function StatusPage({ forbidden = false }) {
  const Icon = forbidden ? ShieldAlert : SearchX;
  return <div className="status-page"><span className="empty-icon"><Icon size={34} /></span><span className="eyebrow">{forbidden ? '403' : '404'}</span><h1>{forbidden ? 'Bạn chưa có quyền truy cập' : 'Trang không tồn tại'}</h1><p>{forbidden ? 'Liên hệ quản lý nếu bạn cần sử dụng chức năng này.' : 'Đường dẫn có thể đã thay đổi. Hãy quay về không gian làm việc.'}</p><Button asChild><Link to="/">Về trang chính</Link></Button></div>;
}
