# Hướng dẫn tiếp quản dự án

## Phạm vi và kiến trúc

- Ứng dụng quản lý bán hàng một cửa hàng, một kho. Giao diện tiếng Việt, VND, Asia/Ho_Chi_Minh.
- Source ứng dụng dùng JavaScript/JSX và ESM. Prisma tự sinh mã trong `backend/generated/`, thư mục này được ignore. Node 24 chạy mã sinh bằng native type stripping, không cần TypeScript compiler.
- Backend modular monolith. Routes gắn middleware/validators, controllers xử lý HTTP, services giữ nghiệp vụ và Prisma transaction.
- Frontend tách pages, components, layouts, services, hooks, contexts, routes và utilities.
- Code rõ ràng, tên mô tả đủ nghĩa, tái sử dụng logic hiện có. Đọc các file liên quan trước khi sửa.

## Quy tắc nghiệp vụ bắt buộc

- Giá và tiền do backend tính bằng Decimal. API trả tiền bằng chuỗi số nguyên VND.
- Hóa đơn đã thanh toán bất biến. Snapshot tên, SKU, giá, khách hàng và khuyến mại tại thời điểm bán.
- Hóa đơn, thanh toán, giảm tồn và stock ledger nằm trong cùng transaction Serializable, retry xung đột có giới hạn.
- Mỗi lần chốt có Idempotency-Key. Kiểm tra ownership cho cả tra cứu ID và tra cứu key. Nhân viên chỉ xem hóa đơn của mình.
- Tồn kho thay đổi qua nghiệp vụ kho, luôn kiểm tra không âm và chống lặp.
- Xóa nghiệp vụ bằng trạng thái hoạt động để giữ lịch sử.
- In hóa đơn bằng CSS print và window.print().

## Bảo mật và dữ liệu

- Hash mật khẩu bằng bcrypt. JWT HttpOnly cookie, session DB, CSRF, backend RBAC và Zod.
- Secrets, mật khẩu demo và database credentials lấy từ môi trường. Không đưa .env, cookie, token hoặc mật khẩu vào log/commit.
- Database test riêng, kiểm thử cạnh tranh dùng PostgreSQL thật. Seed idempotent, giữ dữ liệu hiện có.

## Lệnh làm việc

`npm ci`, `npm run env:init`, `docker compose up -d db`, `npm run db:generate`, `npm run db:migrate`, `npm run db:seed`, `npm run dev`.

Kiểm tra bằng `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e`.

## Quy trình

- Theo kế hoạch M0–M7 trong docs/PLAN.md. Cập nhật docs/PROGRESS.md cùng source mỗi milestone.
- Dùng UI/UX Pro Max khi thiết kế frontend và Playwright cho các luồng giao diện.
- Chỉ đọc file liên quan. Chạy kiểm thử phù hợp thay đổi, tránh chạy lại khi kết quả vẫn còn hiệu lực.
- Commit Conventional Commits và push develop sau milestone đạt kiểm thử. Main do người dùng quyết định merge. Giữ lịch sử Git, không force push.
- Stage rõ file thuộc công việc. Thư mục .agents/ đã tồn tại trước triển khai, giữ nguyên công cụ local này.
- Tự sửa lỗi và tiếp tục các bước được phê duyệt. Chỉ dừng khi hoàn tất, giới hạn tài nguyên hoặc blocker thực sự.
