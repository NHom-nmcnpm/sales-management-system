# Tiến độ triển khai

| Milestone | Trạng thái | Kiểm chứng |
| --- | --- | --- |
| M0 | Hoàn thành | Lint/build, health test 1/1, Prisma recommended generator từ JS chạy PostgreSQL native và Docker Linux đều đạt. Runtime audit 0. Git push develop thực hiện cùng commit milestone |
| M1 | Chờ M0 | Schema/migration/seed |
| M2 | Chờ M1 | Auth và UI framework |
| M3 | Chờ M2 | Sản phẩm/tồn |
| M4 | Chờ M3 | Nhân viên/khách/ưu đãi |
| M5 | Chờ M4 | POS/hóa đơn/in |
| M6 | Chờ M5 | Dashboard/report |
| M7 | Chờ M6 | QA và bàn giao |

Kế hoạch và bổ sung được phê duyệt. Source app JavaScript/JSX. Generator prisma-client 7.10.1 chạy bằng native type stripping Node 24, mã sinh ignored. Đã kiểm chứng cùng pg adapter trên Windows và Docker Linux. JSX/Radix Button build được.

M0 đổi cổng DB local sang 15432 do Windows chặn 5432. Git/npm/socket local cần quyền thực thi ngoài sandbox của phiên này, các lệnh đã được phép chạy. .env được tạo bằng secret ngẫu nhiên và ignored.

Audit M0 có 5 mục High cùng bắt nguồn từ picomatch <=4.0.7 trong Vite/Vitest/tinyglobby/fdir. Registry chưa có bản vá. Chỉ ảnh hưởng glob do người phát triển cung cấp trong công cụ build/test; không có đường nhập glob từ API/người dùng. `npm audit --omit=dev` đạt 0 vulnerabilities. Giữ phiên bản build hiện hành, theo dõi advisory GHSA-fc5q-39xc-vjpf, tránh downgrade/force fix sang Vite cũ.
