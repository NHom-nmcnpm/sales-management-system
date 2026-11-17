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

Employees chỉ quản lý STAFF; khóa hoặc reset password thu hồi session. Customers cho hai vai trò tìm/tạo, cập nhật thuộc MANAGER; chuẩn hóa +84 thành 0 và bỏ dấu cách/gạch ở phone. Promotion tạo/sửa kiểm tra type/value/time, thao tác manager. POST /sales/quote nhận items [{productId,quantity}], customerId/promotionId tùy chọn. Trả items/customer/promotion/subtotal/discount/total/quoteHash/eligiblePromotions. Items trùng ID bị từ chối. Hash không phụ thuộc thứ tự items, giữ tính ổn định khi thay đổi tồn vẫn đủ số lượng.

POST /invoices nhận cart giống quote, quoteHash và payment. CASH có cashReceived (chuỗi VND). BANK_TRANSFER có confirmed=true và transferReference tùy chọn. UUID Idempotency-Key bắt buộc. Lần đầu 201, replay đúng nội dung 200/replayed=true, cùng key khác nội dung 409. By-request lookup luôn có createdById=current user, kể cả MANAGER. GET invoice ID cho manager đọc toàn bộ, staff chỉ của mình. Response loại requestHash và idempotencyKey nội bộ. Quote cũ trả 409 QUOTE_CHANGED. Invoice/payment/items/stock/movement được commit hoặc rollback cùng nhau.

Reports chỉ MANAGER. from/to định dạng YYYY-MM-DD, to bao gồm cả ngày, mặc định đầu tháng hiện tại đến hôm nay. Revenue groupBy=day/month/year, periods thiếu bằng zero. Product report sortBy=quantity/subtotal/name, search/pagination; quantity và subtotal tổng hợp dạng chuỗi để giữ chính xác. Subtotal sản phẩm là trước giảm toàn hóa đơn. Customer detail MANAGER có summary invoiceCount/totalSpent/lastPurchaseAt và GET /customers/:id/invoices. Staff chỉ nhận thông tin cơ bản, không đọc lịch sử/tổng chi tiêu toàn khách.
