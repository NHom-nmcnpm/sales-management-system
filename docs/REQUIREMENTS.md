# Yêu cầu hệ thống

## Chức năng

Nhân viên đăng nhập/đăng xuất, đổi mật khẩu, tra sản phẩm, ghi nhận khách hàng, bán khách lẻ hoặc khách có hồ sơ, chọn số lượng/khuyến mại, xác nhận tiền mặt/chuyển khoản, lập/in hóa đơn và tra lịch sử cá nhân.

Quản lý có các quyền bán hàng và quản lý danh mục, sản phẩm/giá, điều chỉnh tồn có lý do, nhân viên, khách hàng, ưu đãi, hóa đơn, lịch sử mua/tổng chi tiêu, dashboard và báo cáo doanh thu ngày/tháng/năm, sản phẩm bán ra/bán chạy.

## Phi chức năng

JavaScript dễ tiếp quản, modular monolith, REST API thật, PostgreSQL thật. Giao diện tiếng Việt nhất quán, responsive, keyboard/focus và trạng thái loading/empty/error. Tiền VND chính xác bằng Decimal, múi giờ Asia/Ho_Chi_Minh. Secrets môi trường, bảo mật auth/CSRF/RBAC, transaction và kiểm soát cạnh tranh. Chạy được native và Docker, có tài liệu dành cho người mới.

## Quy tắc

- Một kho, số lượng nguyên, tồn và giá không âm. Backend tính tiền và kiểm tra ưu đãi.
- Một khuyến mại toàn hóa đơn, thời gian [bắt đầu, kết thúc), giảm có trần và tối thiểu zero total.
- Hóa đơn PAID bất biến, một payment đầy đủ. Snapshot dữ liệu lúc bán.
- Ghi invoice/payment/stock/ledger trong Serializable transaction, retry xung đột giới hạn.
- Idempotency key + request hash gắn người lập. Tra invoice/key đều kiểm tra ownership.
- Ngừng hoạt động dữ liệu thay cho xóa lịch sử. Báo cáo dùng giao dịch hợp lệ.
- Tiền mặt kiểm tra tiền nhận và tính tiền thừa. Chuyển khoản do nhân viên xác nhận đã nhận, ghi tham chiếu tùy chọn.
