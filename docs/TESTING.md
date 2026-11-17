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

M6 reports+sales 9/9 đạt. Revenue kiểm tra UTC 16:59:59.999/17:00 tương ứng biên ngày Việt Nam, tháng/năm, zero dates, invoice thiếu payment bị loại, product quantity/subtotal và customer lifetime totals. Seed 270 invoice lặp không trùng, payment count và ledger khớp. Playwright dashboard/report/customer 1/1 đối chiếu KPI với API, xem nhóm tháng/năm, product tab và customer detail.

## Nghiệm thu M7 — 18/11/2026

| Hạng mục                    | Kết quả                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| ESLint và production build  | Đạt; Prisma generate, syntax backend và Vite bundle                                                               |
| Vitest/Supertest/PostgreSQL | 30/30, tám file: health, database, auth, catalog, business, sales, reports, security                              |
| Playwright Chromium         | 12 ca đạt: auth 3, catalog 2, business 1, sales 4, reports 1, responsive acceptance 1                             |
| Cài mới native              | Local clone riêng + candidate đã stage, npm ci/build, migrate/seed DB fresh, login/quote/checkout/replay HTTP đạt |
| Docker Linux                | Build/prune, user node UID 1000, migrate/seed DB fresh, recommended Prisma generator và giao dịch thật đạt        |
| Persistence                 | Stop/start cả app và PostgreSQL giữ hóa đơn vừa ghi; readiness healthy                                            |
| Browser bản Docker          | Hai vai trò đăng nhập, staff bị chặn reports, Swagger quản lý và dashboard/POS không có pageerror                 |
| Responsive                  | 375, 768, 1280, 1440 px; dashboard, bảng, POS, hóa đơn không tràn ngang trang                                     |
| Accessibility cơ bản        | Label/error liên kết, focus, dialog, menu ESC/inert, chart có bảng dữ liệu; primary 6.70:1, muted/white 4.76:1    |
| In hóa đơn                  | window.print được gọi, print media ẩn controls/layout và giữ nội dung hóa đơn                                     |
| Secrets và Git              | Index không chứa secrets local, .env, generated client, artifacts hoặc .agents                                    |
| Runtime audit               | 0 vulnerabilities; tooling picomatch advisory chưa có bản vá đã được ghi nhận                                     |

Lượt Playwright toàn bộ ban đầu có 11 ca đạt. Ca thứ 12 được thêm sau review để kiểm tra giá thay đổi không tự thay tiền khách thực nhận; chạy riêng đạt. Responsive acceptance chạy riêng lần cuối để xác nhận sidebar ra ngoài viewport khi đóng. Các kết quả còn lại vẫn có hiệu lực vì phần source liên quan không thay đổi.

Security tests kiểm tra Swagger chỉ cho quản lý, các endpoint có contract, headers CSRF/idempotency và xử lý request không hợp lệ/quá lớn. Các ca sales kiểm tra cả ID và key ownership, bao gồm quản lý không tra key của người khác. Hóa đơn theo ID của nhân viên được lọc trong truy vấn database.

Các thao tác acceptance tạo dữ liệu dùng database riêng có hậu tố `_test`, không dùng mock server. Browser review Docker đọc dữ liệu demo thật. Screenshot/trace và thư mục clone kiểm chứng nằm trong artifacts đã ignore; chúng không phải dependency để chạy ứng dụng hoặc chạy test.

Để kiểm tra lại hai ca cuối khi thay POS hoặc layout:

```powershell
npm run test:e2e -- tests/e2e/acceptance.spec.js
npm run test:e2e -- tests/e2e/sales.spec.js
```
