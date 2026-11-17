# Implementation Plan được phê duyệt

## Phạm vi

Hệ thống bán hàng một cửa hàng, một kho. React/JavaScript/Vite/Tailwind/shadcn, Express/JavaScript/Prisma, PostgreSQL, JWT/bcrypt/Zod/OpenAPI. Kiểm thử Vitest, Supertest, Playwright. Bàn giao local và Docker, source trên develop.

Hai vai trò MANAGER và STAFF. Cho phép khách lẻ. Mỗi sản phẩm một SKU, số lượng nguyên. Chọn tối đa một khuyến mại toàn hóa đơn, giảm phần trăm hoặc số tiền, có thời hạn, tổng tối thiểu và trần giảm. Thanh toán đầy đủ tiền mặt/chuyển khoản, hóa đơn thông thường chưa VAT. Hóa đơn đã thanh toán bất biến. Các nghiệp vụ trả hàng, hoàn tiền, công nợ, biến thể và đa kho dành cho giai đoạn sau.

## Kiến trúc và dữ liệu

Modular monolith, layered architecture. npm workspaces frontend/backend. Routes → validators/middleware → controllers → services → Prisma/PostgreSQL.

Entities User, AuthSession, Category, Product, Customer, Promotion, Invoice, InvoiceItem, Payment, StockMovement. Tiền Decimal(18,0), API chuỗi số nguyên, thời điểm timestamptz và nghiệp vụ Asia/Ho_Chi_Minh. Backend tính giá, snapshot dữ liệu hóa đơn. Serializable transaction ghi hóa đơn/thanh toán/tồn/ledger, tối đa ba lần thực thi khi serialization conflict. Idempotency key gắn người lập và request hash, kiểm tra ownership cho mọi đường tra cứu.

JWT cookie HttpOnly, phiên tám giờ trong DB, CSRF, RBAC, Zod, CORS allowlist, rate limit, bcrypt cost 12, log được loại dữ liệu nhạy cảm. Secrets và mật khẩu demo cấu hình .env.

## UI/UX và màn hình

Tiếng Việt, primary #1D4ED8, nền #F8FAFC, font Be Vietnam Pro, semantic tokens, Lucide, shadcn/Radix. Sidebar/header/breadcrumb, bảng tìm/lọc/sắp xếp/phân trang server và URL filters. Loading/empty/error, phản hồi thao tác, keyboard/focus và dialog truy cập được. Responsive 375/768/1280/1440.

Chung gồm login, hồ sơ, đổi mật khẩu, 403/404. Nhân viên có POS, sản phẩm, khách hàng, hóa đơn và lịch sử cá nhân. Quản lý có dashboard, sản phẩm/danh mục/tồn kho/nhân viên/khách hàng/khuyến mại/hóa đơn/báo cáo. POS tối ưu giỏ hàng, quote backend và phục hồi request khi mất phản hồi. In hóa đơn bằng window.print() và CSS print.

## API

Prefix /api/v1. Modules auth, employees, categories, products, inventory, customers, promotions, sales/quote, invoices, reports, health. Nhân viên đọc dữ liệu phục vụ bán, tạo khách và chỉ đọc hóa đơn do mình lập, kể cả by-request key. Quản lý thao tác danh mục nghiệp vụ, nhân viên và báo cáo. Danh sách mặc định 20 dòng, tối đa 100, sort allowlist. API lỗi có code/message/fieldErrors/requestId. OpenAPI là nguồn contract.

## Milestone và acceptance criteria

| Mốc | Công việc | Điều kiện hoàn thành |
| --- | --- | --- |
| M0 | Workspaces, app JS, lint/build/test, env, Docker DB, generator smoke, docs | Build/lint/health test đạt, Prisma recommended generator dùng từ JS kết nối PostgreSQL trên native và Docker, Git kết nối |
| M1 | Schema, constraints/index, migration, seed nền tảng, DB test, ERD | Migration fresh, seed lặp giữ nhất quán, kiểm thử unique/FK/âm/rollback và ledger |
| M2 | Auth/session/CSRF/RBAC, hồ sơ, khung UI | API auth/security đạt, Playwright login/logout/điều hướng/keyboard |
| M3 | Sản phẩm, danh mục, bảng, tồn kho/ledger | CRUD đúng quyền, âm/trùng bị chặn, điều chỉnh lặp và đồng thời nhất quán, E2E quản trị |
| M4 | Nhân viên, khách, khuyến mại, Decimal quote | Khóa phiên, quyền dữ liệu, validation, khuyến mại các biên và form đạt |
| M5 | POS, thanh toán, transaction, idempotency, phục hồi, chi tiết/in hóa đơn | Concurrency tồn cuối, request trùng, rollback, giá đổi, ownership by-key và E2E bán hàng đạt |
| M6 | Lịch sử, khách hàng, dashboard, báo cáo, demo lịch sử | Số liệu khớp DB, timezone biên ngày/tháng/năm, snapshot, lọc/report E2E đạt |
| M7 | Docker app, review toàn bộ, tài liệu bàn giao | Fresh-clone native/Docker, restart persistence, build/lint/tests/E2E, responsive, bảo mật, docs và push develop hoàn tất |

Mỗi mốc cập nhật PROGRESS.md, review diff/secrets, Conventional Commit và push develop. Kiểm thử nghiệp vụ quan trọng phải đạt trước mốc tiếp theo. Push lỗi giữ commit local, ghi nguyên nhân, chưa đạt DoD tới khi push thành công.

## Kiểm thử và tài liệu

Vitest cho Decimal/khuyến mại/time/hash/validation. Supertest với PostgreSQL riêng cho auth/RBAC/ownership/transaction/idempotency/concurrency/reports. Playwright cho luồng bán/quản trị, responsive, keyboard và in. Review dependency/security và fresh-clone smoke. Chạy lại khi có thay đổi/failure/rủi ro liên quan.

Duy trì AGENTS.md, README.md, docs/REQUIREMENTS.md, ARCHITECTURE.md, ERD.md, USE_CASES.md, API.md, UI_UX.md, PLAN.md, PROGRESS.md, TESTING.md. Mermaid cho ERD/architecture/luồng. README dành cho người mới, có cài đặt, env, migration/seed, tài khoản demo, native/Docker và troubleshooting.

## Bổ sung đã được phê duyệt

- M0 kiểm chứng generator Prisma được khuyến nghị với JavaScript, ưu tiên ổn định và tránh deprecated. Mã app viết JS/JSX, mã sinh do công cụ quản lý.
- In hóa đơn bằng CSS print/window.print().
- Tối ưu đọc file, token và chạy kiểm thử.
- Ownership cả invoice ID và idempotency key.
- Code dễ hiểu để sinh viên tiếp quản.

## Rủi ro

Docker chưa chạy → xử lý M0. Git CLI/network → quyền kết nối phù hợp, giữ commit local. Generator → smoke native/Docker M0. Cạnh tranh tồn/request trùng → transaction/conditional update/unique constraints/tests. Giá đổi → quote hash. Tiền/thời gian → Decimal/timezone tests. Seed/history → idempotent và snapshot. Mobile → QA xuyên milestone.

## Definition of Done

Frontend/backend build; API thật và PostgreSQL; migration/seed; auth/RBAC; bán/thanh toán/hóa đơn/tồn; báo cáo dữ liệu DB; tests quan trọng; xử lý phát hiện bảo mật nghiêm trọng; UI đồng nhất responsive; hai tài khoản và dữ liệu demo; Docker/.env.example; README/API/ERD; commit và push develop.
