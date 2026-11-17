# Tiến độ triển khai

| Milestone | Trạng thái | Kiểm chứng |
| --- | --- | --- |
| M0 | Hoàn thành | Lint/build, health test 1/1, Prisma recommended generator từ JS chạy PostgreSQL native và Docker Linux đều đạt. Runtime audit 0. Git push develop thực hiện cùng commit milestone |
| M1 | Hoàn thành | Migration fresh ở sales và sales_test; seed 2 vai trò/16 sản phẩm; tests 4/4 (unique, FK, âm, rollback, seed lặp và ledger), lint đạt |
| M2 | Hoàn thành | Backend 8/8, Playwright auth 3/3 (hai vai trò, reload, logout, mobile/keyboard), build/lint đạt |
| M3 | Chờ M2 | Sản phẩm/tồn |
| M4 | Chờ M3 | Nhân viên/khách/ưu đãi |
| M5 | Chờ M4 | POS/hóa đơn/in |
| M6 | Chờ M5 | Dashboard/report |
| M7 | Chờ M6 | QA và bàn giao |

Kế hoạch và bổ sung được phê duyệt. Source app JavaScript/JSX. Generator prisma-client 7.10.1 chạy bằng native type stripping Node 24, mã sinh ignored. Đã kiểm chứng cùng pg adapter trên Windows và Docker Linux. JSX/Radix Button build được.

M0 đổi cổng DB local sang 15432 do Windows chặn 5432. Git/npm/socket local cần quyền thực thi ngoài sandbox của phiên này, các lệnh đã được phép chạy. .env được tạo bằng secret ngẫu nhiên và ignored.

Audit M0 có 5 mục High cùng bắt nguồn từ picomatch <=4.0.7 trong Vite/Vitest/tinyglobby/fdir. Registry chưa có bản vá. Chỉ ảnh hưởng glob do người phát triển cung cấp trong công cụ build/test; không có đường nhập glob từ API/người dùng. `npm audit --omit=dev` đạt 0 vulnerabilities. Giữ phiên bản build hiện hành, theo dõi advisory GHSA-fc5q-39xc-vjpf, tránh downgrade/force fix sang Vite cũ.

M0 đã push commit 98e6b8a lên origin/develop. M1 dùng schema 10 entities với FK restrict, unique/index và SQL CHECK. Seed dùng advisory lock/transaction, giữ các bản ghi đã sửa. Test DB bắt buộc tên kết thúc _test và tách DATABASE_URL. Mật khẩu fixture sinh runtime.

M1 push 21cd274. M2 hoàn thiện JWT/session 8h, HttpOnly cookie, CSRF, Origin/JSON guard, password revocation, bcrypt/rate limit, Zod/error chuẩn. UI login/hồ sơ/layout responsive và các states dùng Be Vietnam Pro local, JSX/Radix.

M2 phát hiện và sửa lỗi thứ tự nạp env khiến integration fixtures dùng kết nối DB phát triển. DB này chỉ chứa demo của lượt triển khai và đã seed lại. Setup hiện đặt TEST_DATABASE_URL trước import config; helper kiểm tra current_database() khớp DB _test trước mọi cleanup. Toàn bộ 8 ca backend được chạy lại và đạt với bảo vệ mới. Playwright login hai vai trò đạt sau đó.
