# REST API

Prefix /api/v1. JSON, tiền là chuỗi số nguyên VND, timestamp ISO 8601. OpenAPI trong backend là contract chính, được triển khai cùng các module.

| Nhóm | Paths |
| --- | --- |
| Auth | /auth/login, /auth/logout, /auth/me, /auth/csrf, /auth/profile, /auth/change-password |
| Dữ liệu | /employees, /categories, /products, /customers, /promotions |
| Kho | /inventory, /inventory/movements, /inventory/adjustments |
| Bán hàng | /sales/quote, /invoices, /invoices/:id, /invoices/by-request/:key |
| Báo cáo | /reports/overview, /reports/revenue, /reports/products |
| Health | /health/live, /health/ready |

List query q/page/pageSize/sortBy/sortOrder và bộ lọc module. Mặc định 20, tối đa 100. Response data/pagination. Lỗi code/message/fieldErrors/requestId, mã HTTP 400/401/403/404/409/429/500/503.

JWT cookie HttpOnly, login với Origin hợp lệ. Các request ghi dùng X-CSRF-Token của phiên. Checkout và điều chỉnh kho dùng Idempotency-Key. Nhân viên chỉ đọc invoice/key của mình. Giá/giảm/tổng do backend tính và kiểm tra lại quoteHash.

Login trả data.user và data.csrfToken, đặt cookie sales_session tám giờ. GET /auth/me trả user/CSRF để khôi phục phiên sau reload. Logout thu hồi phiên, đổi mật khẩu thu hồi tất cả phiên của người dùng. PATCH /auth/profile chỉ nhận name. Login tối đa 20 lần thất bại mỗi 15 phút/IP, đổi mật khẩu tối đa 10 lần. Password mới tối thiểu 10 ký tự, tối đa 72 byte.

Products hỗ trợ q/name/SKU, categoryId, isActive và stockStatus=low/out/available. Staff luôn giới hạn sản phẩm/danh mục đang hoạt động. Product create có stock=0, thêm tồn qua inventory. POST /inventory/adjustments nhận productId/delta/reason và UUID Idempotency-Key. Body lặp trả movement cũ, body khác cùng key trả 409. PATCH không thay trường vắng mặt. Ngừng danh mục làm các sản phẩm thuộc danh mục ngừng bán.
