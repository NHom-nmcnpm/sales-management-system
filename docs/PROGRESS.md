# Tiến độ triển khai

| Milestone | Trạng thái | Kiểm chứng                                                                                                                                                                        |
| --------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0        | Hoàn thành | Lint/build, health test 1/1, Prisma recommended generator từ JS chạy PostgreSQL native và Docker Linux đều đạt. Runtime audit 0. Git push develop thực hiện cùng commit milestone |
| M1        | Hoàn thành | Migration fresh ở sales và sales_test; seed 2 vai trò/16 sản phẩm; tests 4/4 (unique, FK, âm, rollback, seed lặp và ledger), lint đạt                                             |
| M2        | Hoàn thành | Backend 8/8, Playwright auth 3/3 (hai vai trò, reload, logout, mobile/keyboard), build/lint đạt                                                                                   |
| M3        | Hoàn thành | Catalog API 3/3, Playwright 2/2, build/lint. Điều chỉnh cùng key/concurrent và tranh tồn cuối đúng                                                                                |
| M4        | Hoàn thành | Business 8/8, Playwright form 1/1, build/lint. Decimal rounding/caps/time boundaries, khóa phiên, quyền và phone normalization đạt                                                |
| M5        | Hoàn thành | Checkout API 6/6; Playwright POS 3/3 (cash/in/mobile, customer/promo/transfer, lost-response recovery); build/lint đạt                                                            |
| M6        | Hoàn thành | Reports + checkout regression 9/9, Playwright dashboard/report/customer 1/1, lint/build; 270 invoice demo và ledger khớp                                                          |
| M7        | Hoàn thành | Backend 30/30; Playwright 12/12; lint/build; cài mới native, Docker Linux, migration/seed, checkout/replay, restart persistence, UI và security review đạt                        |

Kế hoạch và bổ sung được phê duyệt. Source app JavaScript/JSX. Generator prisma-client 7.10.1 chạy bằng native type stripping Node 24, mã sinh ignored. Đã kiểm chứng cùng pg adapter trên Windows và Docker Linux. JSX/Radix Button build được.

M0 đổi cổng DB local sang 15432 do Windows chặn 5432. Git/npm/socket local cần quyền thực thi ngoài sandbox của phiên này, các lệnh đã được phép chạy. .env được tạo bằng secret ngẫu nhiên và ignored.

Audit M0 có 5 mục High cùng bắt nguồn từ picomatch <=4.0.7 trong Vite/Vitest/tinyglobby/fdir. Registry chưa có bản vá. Chỉ ảnh hưởng glob do người phát triển cung cấp trong công cụ build/test; không có đường nhập glob từ API/người dùng. `npm audit --omit=dev` đạt 0 vulnerabilities. Giữ phiên bản build hiện hành, theo dõi advisory GHSA-fc5q-39xc-vjpf, tránh downgrade/force fix sang Vite cũ.

M0 đã push commit 98e6b8a lên origin/develop. M1 dùng schema 10 entities với FK restrict, unique/index và SQL CHECK. Seed dùng advisory lock/transaction, giữ các bản ghi đã sửa. Test DB bắt buộc tên kết thúc _test và tách DATABASE_URL. Mật khẩu fixture sinh runtime.

M1 push 21cd274. M2 hoàn thiện JWT/session 8h, HttpOnly cookie, CSRF, Origin/JSON guard, password revocation, bcrypt/rate limit, Zod/error chuẩn. UI login/hồ sơ/layout responsive và các states dùng Be Vietnam Pro local, JSX/Radix.

M2 phát hiện và sửa lỗi thứ tự nạp env khiến integration fixtures dùng kết nối DB phát triển. DB này chỉ chứa demo của lượt triển khai và đã seed lại. Setup hiện đặt TEST_DATABASE_URL trước import config; helper kiểm tra current_database() khớp DB _test trước mọi cleanup. Toàn bộ 8 ca backend được chạy lại và đạt với bảo vệ mới. Playwright login hai vai trò đạt sau đó.

M2 push 11126bd. M3 có catalog/inventory routes, controllers, services, validators; list tìm/lọc/sort/page, staff scope, PATCH giữ trường không gửi, ngừng hoạt động và movement ledger. UI bảng dùng lại, form dialog, xác nhận và filter URL. Playwright dùng sales_e2e_test và cổng 3001/5174 tách native 3000/5173, migrate/seed tự động.

M3 push e5a437b. M4 hoàn thiện employees/customers/promotions và sales/quote, form quản trị có phản hồi/field errors, seed thêm 6 khách và 2 chương trình. Quote dùng giá DB, kiểm tra hoạt động/tồn/khách/ưu đãi, Decimal ROUND_HALF_UP và fingerprint snapshot. Playwright chờ navigation/logout hoàn tất trước chuyển trang/tài khoản để tránh hủy request của fixture.

M4 push 08141cc. M5 checkout Serializable với từng bước ghi rõ, thanh toán ghi cuối để mọi lỗi sau giảm tồn rollback toàn bộ. Invoice/key ownership được test, by-request luôn gắn current user kể cả manager. POS có cart theo user trong sessionStorage, khóa cart khi chưa rõ kết quả, recovery GET key rồi retry cùng payload/key. In hóa đơn dùng window.print và CSS print A4. Các ca Playwright đã kiểm tra media print và mô phỏng response mất sau commit.

pg 8 có cảnh báo deprecation về client.query concurrency từ truy vấn quan hệ trong Prisma adapter. Query hiện được driver xếp hàng, tests atomic/concurrency đạt. Lockfile giữ pg 8, xem lại tương thích khi nâng Prisma/pg major.

M5 push a9f6187. M6 có revenue day/month/year, zero periods, product ranking, overview, invoice history và customer lifetime stats. SQL report tham số hóa, group theo Asia/Ho_Chi_Minh; kỳ [from 00:00, to+1 00:00). Chỉ PAID có payment được cộng. Charts lazy-loaded, tooltip/totals dùng money string, Number chỉ dùng tọa độ đồ thị.

Demo lịch sử seed: 270 hóa đơn của 90 ngày đã qua, identity cố định, anchor giữ từ lần đầu. Cùng transaction có nhập kho demo và bán, kết quả tồn giữ nguyên và ledger khớp. Seed lặp bỏ qua các invoice đã có; database có giao dịch thật/điều chỉnh thủ công liên quan sẽ giữ nguyên lịch sử thay vì chèn hồi tố. Native đã seed 270, E2E có giao dịch kiểm thử nên lịch sử demo được bỏ qua đúng guard.

M6 push 5b38bf1. M7 hoàn thiện image non-root, migration trước readiness, Express phục vụ bundle cùng origin, Swagger/OpenAPI đầy đủ và chỉ quản lý truy cập. Request lỗi validation dùng tiếng Việt, lỗi payload quá lớn được chuẩn hóa. Runtime bind loopback cho native, bind container qua HOST riêng. Source được format để dễ đọc; README có hướng dẫn từ clone tới chạy và xử lý lỗi.

Nghiệm thu ngày 18/11/2026: toàn bộ 30 backend tests đạt; 11 ca Playwright chạy toàn bộ đạt, sau đó thêm ca xác nhận giá đổi giữ nguyên tiền khách đưa và chạy riêng đạt, tổng 12 ca. Responsive acceptance chạy lại đạt sau bổ sung assertion sidebar đóng hoàn toàn. Các thay đổi cuối được lint/build lại thành công. Không chạy lại các bộ test không liên quan sau khi chỉ cập nhật tài liệu.

Bản cài kiểm chứng dùng local clone riêng, xuất candidate đã stage, `npm ci` và build từ đầu, không dùng node_modules/generated cũ. Database fresh riêng được migrate/seed, server native bản build đăng nhập và tạo hóa đơn qua HTTP; replay trả cùng hóa đơn. Docker runtime đã migrate/seed database fresh riêng, dùng recommended Prisma client thực hiện transaction, kiểm tra stock/replay/key ownership. Khởi động lại cả app và db giữ nguyên dữ liệu đã ghi. App chạy UID 1000, health ready đạt và hai vai trò dùng được qua browser trên cổng 8080.

Review UI dùng screenshot dashboard/POS desktop/mobile từ Docker, không có pageerror. Kiểm tra 375/768/1280/1440 không tràn ngang trang, menu ESC/focus, CSS print và window.print. Cải thiện tương phản metadata và labels, primary 6.70:1 và muted text trên nền trắng 4.76:1. Artifact QA được ignore. Dọn các fixture catalog E2E tạo lúc đầu, chỉ khi không có dòng hóa đơn; 270 hóa đơn demo được bảo toàn.

Review Git index không chứa giá trị secrets local, .env, generated code, artifacts hoặc .agents. Runtime audit đạt 0, các advisory tooling và cảnh báo pg được ghi ở trên và trong README. M7 sử dụng Conventional Commit và push thường lên origin/develop; không thay đổi main và không force push.

## Commit theo milestone

| Milestone | Commit                                                       |
| --------- | ------------------------------------------------------------ |
| M0        | 98e6b8a                                                      |
| M1        | 21cd274                                                      |
| M2        | 11126bd                                                      |
| M3        | e5a437b                                                      |
| M4        | 08141cc                                                      |
| M5        | a9f6187                                                      |
| M6        | 5b38bf1                                                      |
| M7        | Commit chứa bản nghiệm thu và tài liệu này; xem `git log -1` |
