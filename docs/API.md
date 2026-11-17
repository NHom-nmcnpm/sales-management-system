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
