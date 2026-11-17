# Sổ Bán Hàng

Hệ thống quản lý bán hàng một cửa hàng bằng React, Express, Prisma và PostgreSQL. Giao diện tiếng Việt, hai vai trò quản lý và nhân viên. Kế hoạch trong [docs/PLAN.md](docs/PLAN.md), trạng thái thực tế trong [docs/PROGRESS.md](docs/PROGRESS.md).

## Yêu cầu

- Node.js 24.12+ thuộc dòng 24 LTS và npm.
- Docker Desktop đang chạy Linux containers.
- Git.

## Khởi động phát triển

```powershell
git clone https://github.com/NHom-nmcnpm/sales-management-system.git
cd sales-management-system
git switch develop
npm ci
npm run env:init
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Frontend tại http://localhost:5173, API tại http://localhost:3000/api/v1. `npm run env:init` tạo `.env` local cùng secret và mật khẩu ngẫu nhiên, giữ nguyên file nếu đã tồn tại. Mở `.env` để cấu hình hai tài khoản demo trước khi seed. Giữ file này trên máy cá nhân.

Prisma dùng generator `prisma-client` được khuyến nghị. Source app là JS/JSX. Node 24 native type stripping thực thi mã Prisma tự sinh trong `backend/generated/`; thư mục generated được ignore và tái tạo bằng `npm run db:generate`.

## Kiểm tra

```powershell
npm run lint
npm run build
npm run db:smoke
npm test
npm run test:e2e
```

Các lệnh migration/seed và E2E được hoàn thiện theo milestone. Theo dõi PROGRESS trước khi sử dụng chức năng đang triển khai.
