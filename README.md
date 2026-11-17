# Sổ Bán Hàng

Hệ thống quản lý bán hàng cho một cửa hàng, một kho. Giao diện tiếng Việt, tiền VND và múi giờ `Asia/Ho_Chi_Minh`.

React 19 · Vite 8 · Tailwind CSS 4 · shadcn/ui + Radix · Express 5 · Prisma 7 · PostgreSQL 17 · JavaScript/JSX.

## Chức năng

| Nhân viên bán hàng                               | Quản lý                                                          |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| POS, tìm hàng, giỏ hàng, khách lẻ/khách có hồ sơ | Toàn bộ quyền bán hàng                                           |
| Chọn khuyến mại, tiền mặt/chuyển khoản           | Sản phẩm, danh mục, giá bán, tồn kho và lịch sử biến động        |
| Lập/in hóa đơn, phục hồi giao dịch mất phản hồi  | Nhân viên, khóa tài khoản, đặt lại mật khẩu                      |
| Tra hóa đơn do mình lập                          | Khách hàng, lịch sử mua và tổng chi tiêu                         |
| Hồ sơ và đổi mật khẩu                            | Khuyến mại, toàn bộ hóa đơn, dashboard và báo cáo ngày/tháng/năm |

Hóa đơn đã thanh toán giữ nguyên snapshot. Giá và tiền được backend tính bằng Decimal. Transaction ghi hóa đơn, thanh toán và tồn kho đồng thời, có chống lặp và kiểm soát cạnh tranh.

## Chuẩn bị

1. Cài Git, Node.js dòng **24 LTS, tối thiểu 24.12**, và Docker Desktop.
2. Mở Docker Desktop, chờ Engine chạy với Linux containers.
3. Mở terminal tại thư mục muốn lưu dự án.

Đã kiểm chứng trên Windows với Node 24.19.0 và Docker Linux với Node 24.22.3. Nên dùng bản vá mới nhất của dòng Node 24. Lockfile khóa dependency; Dockerfile và Compose khóa image bằng digest.

Các cổng mặc định là PostgreSQL `15432`, API/bản build `3000`, Vite `5173` và Docker app `8080`. Playwright dùng cổng riêng `3001/5174`.

## Clone và cấu hình

```powershell
git clone https://github.com/NHom-nmcnpm/sales-management-system.git
cd sales-management-system
git switch develop
npm ci
npm run env:init
```

`env:init` tạo `.env` local với secret và mật khẩu ngẫu nhiên. Mở `.env` bằng trình soạn thảo để xem hoặc đặt mật khẩu demo trước khi seed. Lệnh giữ file hiện có khi chạy lại.

| Biến                                                | Ý nghĩa                                                     |
| --------------------------------------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`                                      | Kết nối PostgreSQL phát triển                               |
| `TEST_DATABASE_URL`                                 | Database integration riêng, tên kết thúc `_test`            |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Cấu hình database trong Docker                              |
| `POSTGRES_PORT`                                     | Cổng truy cập database từ máy, mặc định 15432               |
| `JWT_SECRET`                                        | Secret ngẫu nhiên, tối thiểu 64 ký tự                       |
| `PORT`, `HOST`                                      | API local, mặc định 3000 và 127.0.0.1                       |
| `APP_ORIGIN`                                        | Origin giao diện phát triển, mặc định http://localhost:5173 |
| `COOKIE_SECURE`                                     | `false` cho HTTP local, `true` khi dùng HTTPS               |
| `SEED_MANAGER_EMAIL`, `SEED_MANAGER_PASSWORD`       | Tài khoản quản lý demo                                      |
| `SEED_STAFF_EMAIL`, `SEED_STAFF_PASSWORD`           | Tài khoản nhân viên demo                                    |

Mật khẩu demo cần ít nhất 10 ký tự và tối đa 72 byte. `.env.example` mô tả các biến bằng placeholder. `.env` được Git và Docker build ignore.

## Chạy phát triển

```powershell
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Mở [giao diện phát triển](http://localhost:5173). API health tại [readiness](http://localhost:3000/api/v1/health/ready).

Tài khoản mặc định là `manager@example.test` và `staff@example.test`, mật khẩu theo `.env`. Nếu thay email trong cấu hình, dùng email đã cấu hình. Seed giữ nguyên mật khẩu và thông tin tài khoản đã tồn tại. Đổi mật khẩu qua hồ sơ hoặc chức năng quản lý nhân viên.

Seed nền tảng gồm hai vai trò, 16 sản phẩm văn phòng, bốn danh mục, sáu khách hàng và hai khuyến mại. Database mới được bổ sung 270 hóa đơn của 90 ngày đã qua, có payment và stock ledger. Seed lịch sử chạy lặp giữ nguyên dữ liệu đã tạo. Khi phát hiện giao dịch thật hoặc điều chỉnh kho thủ công liên quan, seed giữ lịch sử đang sử dụng. Các màn hình truy vấn dữ liệu PostgreSQL qua API.

## Chạy bản build native

Kết thúc `npm run dev` bằng Ctrl+C để nhường cổng 3000, rồi chạy.

```powershell
npm run build
npm start
```

Mở [bản build](http://localhost:3000). Express phục vụ cả frontend và API. Script start đặt Origin local đúng theo cổng chạy. Có thể đặt `START_ORIGIN` nếu dùng địa chỉ local khác.

## Chạy toàn bộ bằng Docker

Sau bước clone và `npm run env:init`, chạy.

```powershell
docker compose up -d --build --wait app
docker compose exec -T app npm run db:seed -w backend
```

Mở [ứng dụng Docker](http://localhost:8080). Container app chờ PostgreSQL healthy, chạy migration và khởi động bằng user `node`. Frontend và API dùng cùng origin. Database nằm trong named volume `sales_data`.

```powershell
docker compose ps
docker compose logs --tail=50 app
docker compose stop app
```

`stop` giữ dữ liệu để chạy lại. Cấu hình cổng và Origin Docker nằm trong `compose.yaml`. Healthcheck dùng `/api/v1/health/ready`.

## Kiểm thử

```powershell
npm run lint
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

`npm test` tự tạo và migrate database từ `TEST_DATABASE_URL`. Fixture xác nhận tên database thực tế trước khi dọn dữ liệu. Playwright tự chuẩn bị database riêng có hậu tố `_e2e_test`, seed và khởi động API/Vite ở 3001/5174. Các cổng này cần sẵn sàng khi chạy E2E.

Playwright kiểm tra bán tiền mặt/chuyển khoản, khuyến mại, khách hàng, in, mất phản hồi sau commit, quản trị, báo cáo, bàn phím và responsive. Báo cáo HTML tại `playwright-report/index.html`, trace/screenshot khi lỗi tại `test-results/`. Các artifact được ignore.

Để kiểm tra riêng các ca liên quan.

```powershell
npm exec -w backend -- vitest run tests/sales.test.js
npm run test:e2e -- tests/e2e/sales.spec.js
```

## API và tài liệu

Đăng nhập vai trò quản lý rồi mở Swagger tại `/api/v1/docs/` trên cùng địa chỉ giao diện đang dùng, ví dụ [Swagger phát triển](http://localhost:5173/api/v1/docs/) hoặc [Swagger Docker](http://localhost:8080/api/v1/docs/). Contract JSON tại `/api/v1/openapi.json`. Try it out tự lấy CSRF cho request ghi.

| Tài liệu                             | Nội dung                               |
| ------------------------------------ | -------------------------------------- |
| [PLAN](docs/PLAN.md)                 | Phạm vi và kế hoạch M0–M7 đã duyệt     |
| [PROGRESS](docs/PROGRESS.md)         | Kết quả triển khai, kiểm thử và Git    |
| [REQUIREMENTS](docs/REQUIREMENTS.md) | Yêu cầu và quy tắc nghiệp vụ           |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Phân lớp và quyết định kỹ thuật        |
| [ERD](docs/ERD.md)                   | Quan hệ, constraints và index          |
| [USE_CASES](docs/USE_CASES.md)       | Actors và luồng nghiệp vụ              |
| [API](docs/API.md)                   | Contract và cách gọi API               |
| [UI_UX](docs/UI_UX.md)               | Design system và accessibility         |
| [TESTING](docs/TESTING.md)           | Cách kiểm thử và bằng chứng nghiệm thu |
| [AGENTS](AGENTS.md)                  | Hướng dẫn cho người/agent tiếp quản    |

## Tiếp quản source

`frontend/src` tách pages, components, layouts, contexts, hooks, routes, services và utilities. `backend/src/modules` tách routes, validators, controllers và services theo nghiệp vụ. Service quản lý transaction, controller quản lý HTTP.

Source ứng dụng là JavaScript/JSX. Generator `prisma-client` được khuyến nghị sinh mã trong `backend/generated/`. Node 24 chạy mã tự sinh bằng native type stripping. Thư mục generated được ignore và tạo lại bằng `npm run db:generate`, giữ quá trình cài đặt gọn với generator đang được khuyến nghị.

Khi sửa schema, tạo migration bằng `npm run db:dev -- --name ten_thay_doi`, review SQL và chạy kiểm thử liên quan. Cập nhật tài liệu cùng commit. Làm việc trên `develop`, Conventional Commits và push sau milestone đạt kiểm thử.

## Xử lý lỗi thường gặp

| Hiện tượng                               | Cách xử lý                                                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Docker báo không tìm thấy Engine         | Mở Docker Desktop và chờ Linux Engine sẵn sàng                                                                 |
| Cổng database bị chiếm hoặc Windows chặn | Chọn `POSTGRES_PORT` khác và cập nhật hai URL database trong `.env`, rồi tạo lại service db                    |
| Database authentication failed           | Đối chiếu mật khẩu trong URL với cấu hình volume hiện có. Dùng thông tin đã tạo volume hoặc database mới riêng |
| Thiếu generated client                   | Chạy `npm run db:generate`                                                                                     |
| Request bị ORIGIN_REJECTED               | Dùng đúng `localhost`/cổng theo APP_ORIGIN. Docker mặc định http://localhost:8080                              |
| Phiên bị thu hồi sau đổi mật khẩu        | Đăng nhập lại bằng mật khẩu mới                                                                                |
| npm.ps1 bị PowerShell chặn               | Dùng `npm.cmd` và `npx.cmd` trong các lệnh tương ứng                                                           |
| Cổng E2E bận                             | Dừng tiến trình kiểm thử cũ đang dùng 3001/5174 rồi chạy lại                                                   |

## Tình trạng dependency

Audit dependency runtime đạt zero tại nghiệm thu. Tooling Vite/Vitest có advisory picomatch `GHSA-fc5q-39xc-vjpf` chưa có bản vá trên registry trong lần kiểm tra. Glob do developer cấu hình, API không nhận glob. Image runtime loại devDependencies.

Prisma/pg 8 có thể in cảnh báo deprecation khi xếp hàng truy vấn quan hệ trong transaction. Kiểm thử atomic và concurrency đã đạt. Lockfile giữ phiên bản đã kiểm chứng; kiểm tra lại tương thích trước khi nâng major Prisma/pg.
