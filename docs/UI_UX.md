# UI/UX

Sử dụng UI/UX Pro Max local tại .agents/skills/ui-ux-pro-max. Đã kiểm tra validate_data.py đạt 12 domains/22 stacks. Tra cứu product inventory/stock đề xuất Flat Design/Minimalism, dashboard dense. Chart revenue trend đề xuất line chart cùng bảng dữ liệu. React/shadcn hướng dẫn form controlled, error gắn trường và semantic tables. Bố cục landing do design-system sinh được đối chiếu, chọn hướng dashboard theo nghiệp vụ.

## Tokens

Primary #1D4ED8, nền #F8FAFC, card trắng, chữ #0F172A, success green/warning amber/error red kèm chữ. Font Be Vietnam Pro local, spacing 4/8/12/16/24/32, tabular numbers. shadcn JSX + Radix và Lucide.

## Trải nghiệm

Sidebar/header/breadcrumb. Bảng tìm/lọc/sort/pagination giữ URL. Form label/error rõ, dialog focus và xác nhận thao tác quan trọng. Loading skeleton, empty state và error retry. Desktop POS hai cột, mobile giỏ dễ mở và tổng tiền/action hiển thị rõ.

QA 375/768/1280/1440, bàn phím, focus, giảm chuyển động và tương phản. Hóa đơn có CSS print, chỉ vùng nội dung hóa đơn hiển thị khi window.print().

## Cài đặt thực tế

Font Be Vietnam Pro đóng gói local, màu primary qua semantic token. Các label/metadata dùng màu tương phản rõ hơn sau review. Form native có label liên kết ID và lỗi qua aria-describedby, summary lỗi được focus. Zod locale Việt cho lỗi validation. Modal Radix trap focus/ESC và trả focus về thao tác trước.

Mobile sidebar hỗ trợ ESC, aria-expanded/controls và inert để nội dung ẩn không nhận focus. Touch actions tăng hit area. POS mobile có thanh giỏ ở đáy và cuộn đến cart, trường thanh toán/phím số phù hợp. Bảng giới hạn cuộn ngang trong panel. Invoice print A4 giữ bảng/tổng tiền và ẩn các controls.

Dashboard có bốn KPI, line revenue và horizontal bar sản phẩm bán chạy, recent invoices. Reports có tab revenue/products, date range, group day/month/year, bảng sort/search/pagination. Chart có bảng/số liệu chi tiết để đọc bằng bàn phím và đối chiếu.
