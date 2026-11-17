# Kiểm thử

Mỗi milestone chạy tập kiểm tra phù hợp, cập nhật kết quả tại PROGRESS.md.

- npm run lint — ESLint JS/JSX.
- npm run build — generate Prisma, kiểm tra syntax backend, Vite production bundle.
- npm run db:smoke — Prisma recommended generator từ JavaScript kết nối PostgreSQL.
- npm test — tạo database riêng từ TEST_DATABASE_URL nếu thiếu, migrate và chạy Vitest/Supertest. Tên database phải kết thúc _test và khác DATABASE_URL.
- npm run test:e2e — Playwright, browser và cấu hình hoàn thiện tại M2.

Unit kiểm tra Decimal, rounding, promotion/time boundaries, validation và hash. Integration kiểm tra auth/CSRF/RBAC/ownership, DB constraints, rollback, stock race và idempotency. E2E kiểm tra đăng nhập, quản trị, POS, tiền mặt/chuyển khoản, khuyến mại, khách lẻ/khách hồ sơ, report và in. Browser QA responsive 375/768/1280/1440, keyboard và trạng thái.

Dữ liệu test nằm DB riêng, fixtures sinh mật khẩu lúc chạy. Secrets được lấy qua môi trường. Đối chiếu số liệu DB sau nghiệp vụ, không dùng mock để thay luồng hoàn thành.

## Kết quả M0

Prisma smoke native và `docker compose --profile tools run --rm --build smoke` đều đạt. Lint/build và health 1/1 đạt. Trong sandbox Windows các socket có thể trả EACCES, chạy các kiểm tra có network với quyền phù hợp. Cổng DB local 15432.

Runtime audit 0. Advisory picomatch GHSA-fc5q-39xc-vjpf còn ở tooling Vite/Vitest, chưa có phiên bản vá trên registry tại lúc kiểm tra. Cấu hình glob nằm trong source do developer kiểm soát, không nhận từ người dùng sản phẩm.

## Kết quả M1–M2

8 backend tests đạt, gồm constraints/seed/rollback và auth/CSRF/session/password/rate limit. Playwright auth 3/3 đạt cho hai vai trò và mobile keyboard. Test setup nạp .env rồi gán DATABASE_URL test trước import config. Cleanup xác minh current_database() khớp tên TEST_DATABASE_URL và kết thúc _test, chặn nhầm database ở tầng kết nối thực tế.

M3 catalog API 3/3, Playwright catalog 2/2 đạt. Kiểm tra manager/staff, sort allowlist, Decimal JSON, low-stock filter, PATCH không reset trường, adjustment retry cùng key và concurrent stock cuối. Playwright tự tạo/migrate/seed sales_e2e_test, chạy API 3001 và Vite 5174, giữ môi trường native độc lập.

M4 business 8/8 đạt cho rounding/caps/zero, thời hạn [start,end), giá đổi, cấm giá client/duplicate cart lines, khóa phiên staff, manager account protection, phone normalization và promotion PATCH. Playwright form khách/ưu đãi/nhân viên 1/1 đạt.

M5 checkout 6/6 đạt. Trigger test trong DB _test cố ý từ chối ghi Payment sau giảm tồn để xác nhận rollback toàn bộ. Có ca tranh tồn cuối, same-key concurrency, request khác key cũ, price change, insufficient cash và ownership ID/key. Playwright POS 3/3 đạt, gồm CSS print/window.print stub, mobile, bank xác nhận/khách/khuyến mại và route.fetch rồi abort để mô phỏng mất response sau commit; reload recovery mở đúng invoice cũ.
