import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '../contexts/auth.js';
import { Loading } from '../components/common/States.jsx';
import { AppLayout } from '../layouts/AppLayout.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { ProfilePage } from '../pages/ProfilePage.jsx';
import { StatusPage } from '../pages/StatusPage.jsx';
import { ProductsPage } from '../pages/ProductsPage.jsx';
import { CategoriesPage } from '../pages/CategoriesPage.jsx';
import { InventoryPage } from '../pages/InventoryPage.jsx';
import { EmployeesPage } from '../pages/EmployeesPage.jsx';
import { CustomersPage } from '../pages/CustomersPage.jsx';
import { PromotionsPage } from '../pages/PromotionsPage.jsx';
import { PosPage } from '../pages/PosPage.jsx';
import { InvoicePage } from '../pages/InvoicePage.jsx';
import { CartProvider } from '../contexts/CartProvider.jsx';

export function ProtectedRoute({ manager = false }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Đang kiểm tra phiên đăng nhập…" />;
  if (!user) return <Navigate to="/dang-nhap" replace />;
  if (manager && user.role !== 'MANAGER') return <Navigate to="/khong-co-quyen" replace />;
  return <Outlet />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/dang-nhap" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<CartProvider><AppLayout /></CartProvider>}>
          <Route index element={<HomeRedirect />} />
          <Route path="/ho-so" element={<ProfilePage />} />
          <Route path="/ban-hang" element={<PosPage />} />
          <Route path="/hoa-don/:id" element={<InvoicePage />} />
          <Route path="/san-pham" element={<ProductsPage />} />
          <Route path="/khach-hang" element={<CustomersPage />} />
          <Route element={<ProtectedRoute manager />}>
            <Route path="/danh-muc" element={<CategoriesPage />} />
            <Route path="/ton-kho" element={<InventoryPage />} />
            <Route path="/ton-kho/lich-su" element={<InventoryPage movements />} />
            <Route path="/nhan-vien" element={<EmployeesPage />} />
            <Route path="/khuyen-mai" element={<PromotionsPage />} />
          </Route>
          <Route path="/khong-co-quyen" element={<StatusPage forbidden />} />
          <Route path="*" element={<StatusPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user.role === 'MANAGER' ? '/ho-so' : '/ban-hang'} replace />;
}
