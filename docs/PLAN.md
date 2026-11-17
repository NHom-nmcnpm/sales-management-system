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

| Mốc | Công việc                                                                  | Điều kiện hoàn thành                                                                                                      |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| M0  | Workspaces, app JS, lint/build/test, env, Docker DB, generator smoke, docs | Build/lint/health test đạt, Prisma recommended generator dùng từ JS kết nối PostgreSQL trên native và Docker, Git kết nối |
| M1  | Schema, constraints/index, migration, seed nền tảng, DB test, ERD          | Migration fresh, seed lặp giữ nhất quán, kiểm thử unique/FK/âm/rollback và ledger                                         |
| M2  | Auth/session/CSRF/RBAC, hồ sơ, khung UI                                    | API auth/security đạt, Playwright login/logout/điều hướng/keyboard                                                        |
| M3  | Sản phẩm, danh mục, bảng, tồn kho/ledger                                   | CRUD đúng quyền, âm/trùng bị chặn, điều chỉnh lặp và đồng thời nhất quán, E2E quản trị                                    |
| M4  | Nhân viên, khách, khuyến mại, Decimal quote                                | Khóa phiên, quyền dữ liệu, validation, khuyến mại các biên và form đạt                                                    |
| M5  | POS, thanh toán, transaction, idempotency, phục hồi, chi tiết/in hóa đơn   | Concurrency tồn cuối, request trùng, rollback, giá đổi, ownership by-key và E2E bán hàng đạt                              |
| M6  | Lịch sử, khách hàng, dashboard, báo cáo, demo lịch sử                      | Số liệu khớp DB, timezone biên ngày/tháng/năm, snapshot, lọc/report E2E đạt                                               |
| M7  | Docker app, review toàn bộ, tài liệu bàn giao                              | Fresh-clone native/Docker, restart persistence, build/lint/tests/E2E, responsive, bảo mật, docs và push develop hoàn tất  |

Mỗi mốc cập nhật PROGRESS.md, review diff/secrets, Conventional Commit và push develop. Kiểm thử nghiệp vụ quan trọng phải đạt trước mốc tiếp theo. Push lỗi giữ commit local, ghi nguyên nhân, chưa đạt DoD tới khi push thành công.

### M0 — Nền tảng dự án và môi trường

1. Kiểm tra working tree, develop, remote và khả năng push; giữ nguyên .agents có sẵn.
2. Thiết lập npm workspaces, React JavaScript/JSX, Express ESM, lint và scripts dev/build/test.
3. Cấu hình biến môi trường, .env.example và validate; khởi động PostgreSQL bằng Compose.
4. Kiểm chứng generator Prisma được khuyến nghị qua JavaScript trên Windows và Docker Linux; kiểm tra shadcn JSX và peer dependencies, khóa lockfile.
5. Tạo AGENTS, README và bộ docs nền tảng.

Nghiệm thu: frontend build, health endpoint/test, lint, DB ready và Prisma smoke native/Docker đều đạt. Không stage secrets. Chỉ chuyển M1 khi kết nối PostgreSQL đã được kiểm chứng.

### M1 — Database, migration và seed

1. Tạo đủ 10 entities, quan hệ, unique constraints, indexes và migration CHECK cho số tiền/số lượng.
2. Seed hai vai trò, danh mục/sản phẩm, hash mật khẩu lấy từ môi trường; chạy lặp bảo toàn dữ liệu hiện có.
3. Thiết lập database integration riêng và guard tránh cleanup database phát triển.
4. Hoàn thiện ERD, quy tắc Decimal/timestamptz và hướng dẫn migration.

Nghiệm thu: migrate database mới, seed lặp, FK/unique/âm/rollback được test với PostgreSQL thật. Tồn hiện tại đối chiếu đúng tổng stock ledger.

### M2 — Authentication, phân quyền và khung UI

1. JWT cookie/session DB tám giờ, CSRF, login/logout/me, hồ sơ và đổi mật khẩu; thu hồi phiên khi cần.
2. Authentication middleware, backend RBAC, validation/error response, Origin/JSON guard và rate limit.
3. Design tokens, sidebar/header/breadcrumb, route guards, login/profile/403/404 và các states dùng chung.
4. Áp dụng UI/UX Pro Max; kiểm tra bàn phím và responsive từ nền tảng.

Nghiệm thu: hai vai trò đăng nhập đúng, logout/password change thu hồi phiên, tài khoản khóa/hết phiên bị từ chối; auth/CSRF/rate limit integration và Playwright login/logout/navigation đạt.

### M3 — Sản phẩm, danh mục và kho

1. API và form tạo/sửa/ngừng hoạt động sản phẩm/danh mục; SKU duy nhất, giá Decimal.
2. Bảng chung với tìm kiếm, bộ lọc, sort allowlist, phân trang server và URL state.
3. Điều chỉnh tồn có lý do, transaction và key chống lặp; sổ biến động, ngưỡng tồn thấp.
4. Nhân viên tra cứu các sản phẩm/danh mục đang hoạt động theo quyền.

Nghiệm thu: quyền manager/staff chính xác, SKU trùng/giá sai/âm tồn bị chặn, cùng key chỉ điều chỉnh một lần, đồng thời giữ ledger khớp; Playwright tạo/tìm sản phẩm và điều chỉnh tồn đạt.

### M4 — Nhân viên, khách hàng và khuyến mại

1. Quản lý chỉ tạo/quản lý STAFF, khóa tài khoản và reset mật khẩu thu hồi phiên.
2. Khách hàng tìm/tạo trong luồng bán; quản lý sửa/ngừng hoạt động; chuẩn hóa điện thoại tùy chọn duy nhất.
3. Khuyến mại phần trăm/số tiền với tổng tối thiểu, trần giảm, trạng thái và thời hạn.
4. Service quote Decimal: backend tính giá, ưu đãi hợp lệ và quote hash; form hiển thị lỗi cụ thể và giữ dữ liệu.

Nghiệm thu: quyền/dữ liệu response theo vai trò, email/phone/code trùng và khóa phiên được kiểm tra; rounding HALF_UP, chưa bắt đầu/hết hạn/chưa đạt điều kiện/cap/tổng bằng không đạt; E2E form quản trị đạt.

### M5 — POS, thanh toán và hóa đơn

1. POS tìm/chọn sản phẩm, giỏ hàng, khách lẻ/khách hồ sơ, quote và chọn tối đa một ưu đãi.
2. Xác nhận tiền mặt đủ, tiền thừa hoặc đã nhận chuyển khoản; quote thay đổi yêu cầu xác nhận lại.
3. Serializable transaction kiểm tra lại dữ liệu, conditional stock update, invoice/items/payment/ledger; retry conflict tối đa ba lần thực thi.
4. Key gắn người lập và request hash, xử lý replay tuần tự/đồng thời và nội dung khác trả 409.
5. sessionStorage theo người dùng giữ payload/key đang chờ; tra cứu đúng ownership trước retry, giữ giỏ khi lỗi.
6. Chi tiết hóa đơn snapshot và in qua CSS print/window.print.

Nghiệm thu: tồn cuối chỉ một giao dịch thành công, cùng key chỉ một invoice, lỗi payment rollback cả stock; giá/ưu đãi thay đổi và thiếu tiền bị chặn. Kiểm thử ownership cả ID/key, khách lẻ/khách hồ sơ, cash/transfer/promo, mất phản hồi sau commit và in đạt. Không tự thay số tiền khách đã đưa khi quote thay đổi.

### M6 — Lịch sử, dashboard và báo cáo

1. Tra cứu hóa đơn cá nhân/toàn cửa hàng với quyền backend, tìm/lọc/sort/phân trang.
2. Chi tiết khách hàng, lịch sử mua, số hóa đơn và tổng chi tiêu dành quản lý.
3. Dashboard KPI, doanh thu, top sản phẩm, tồn thấp và giao dịch gần đây từ API thật.
4. Revenue day/month/year, kỳ trống bằng 0, báo cáo sản phẩm bán ra; timezone Việt Nam và khoảng kết thúc loại trừ.
5. Seed lịch sử nhất quán/idempotent qua transaction, giữ snapshot và ledger, bảo toàn dữ liệu có giao dịch thực.

Nghiệm thu: số liệu đối chiếu database, chỉ PAID có payment được cộng, biên nửa đêm/tháng/năm đúng; sửa catalog không đổi lịch sử. Playwright bộ lọc/thống kê/chi tiết khách hàng đạt; chart có bảng đối chiếu, empty/error states.

### M7 — Kiểm thử tổng thể và bàn giao

1. Docker image khóa digest, runtime non-root, prune dev dependencies; Compose healthcheck, volume và migration trước readiness.
2. Express phục vụ frontend build cùng origin; seed bằng lệnh riêng, hỗ trợ native và Docker.
3. OpenAPI/Swagger đầy đủ quyền, request/response, CSRF, idempotency và lỗi; bảo vệ tài liệu quản trị.
4. Chạy toàn bộ backend/E2E một lượt, kiểm thử bổ sung khi có thay đổi liên quan; build/lint và dependency/security review.
5. Cài từ source fresh, migrate/seed DB mới, checkout/replay trên native và Linux, restart giữ dữ liệu.
6. Review screenshot, responsive, keyboard/focus/contrast, print; hoàn thiện README và toàn bộ tài liệu.
7. Review staged diff/secrets, commit và push develop; kiểm tra remote đồng bộ.

Nghiệm thu: toàn bộ Definition of Done bên dưới đạt. Các phát hiện chưa có bản vá trong công cụ phát triển phải ghi rõ ảnh hưởng, phạm vi và cách theo dõi; ứng dụng runtime không có phát hiện nghiêm trọng chưa xử lý.

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

## Quyết định đã kiểm chứng trong triển khai

- Dùng generator `prisma-client` 7.10.1 được khuyến nghị thay cho `prisma-client-js` deprecated. Node 24 chạy mã sinh bằng native type stripping; app vẫn là JS/JSX, không thêm TypeScript compiler. Mã sinh ignored, tạo lại khi build. Smoke Windows và Docker Linux đạt tại M0 và nghiệm thu M7.
- PostgreSQL 17.12 và Node 24 image khóa digest; lockfile giữ dependency đã kiểm chứng. Cổng PostgreSQL host đổi sang 15432 vì Windows chặn 5432.
- Quản lý có quyền POS; session tám giờ; giao diện sáng; mật khẩu demo qua môi trường. By-request lookup luôn gắn chính người gọi, kể cả quản lý. Quản lý xem hóa đơn người khác bằng ID qua API được phân quyền.
- Thông tin chi tiết: [yêu cầu](REQUIREMENTS.md), [kiến trúc](ARCHITECTURE.md), [ERD](ERD.md), [actors/ma trận quyền/luồng](USE_CASES.md), [API](API.md), [UI/UX](UI_UX.md), [kiểm thử](TESTING.md). Kết quả và commit nằm tại [PROGRESS](PROGRESS.md).
