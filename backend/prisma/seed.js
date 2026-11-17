import bcrypt from 'bcrypt';
import { pathToFileURL } from 'node:url';
import { prisma } from '../src/prisma/client.js';
import { withTransaction } from '../src/utilities/transaction.js';
import { seedDemoSales } from './seed-sales.js';

const catalog = [
  ['Bút viết', 'VP-B001', 'Bút bi Thiên Long TL-027', 'Cây', '5000', 180],
  ['Bút viết', 'VP-B002', 'Bút gel mực đen 0.5mm', 'Cây', '12000', 120],
  ['Bút viết', 'VP-B003', 'Bút dạ quang pastel', 'Cây', '18000', 60],
  ['Bút viết', 'VP-B004', 'Bộ bút màu 12 màu', 'Hộp', '65000', 35],
  ['Sổ & giấy', 'VP-S001', 'Sổ tay bìa da A5', 'Quyển', '89000', 45],
  ['Sổ & giấy', 'VP-S002', 'Vở kẻ ngang 200 trang', 'Quyển', '25000', 140],
  ['Sổ & giấy', 'VP-S003', 'Giấy in A4 Double A', 'Ram', '85000', 55],
  ['Sổ & giấy', 'VP-S004', 'Giấy ghi chú nhiều màu', 'Tập', '15000', 90],
  ['Dụng cụ văn phòng', 'VP-D001', 'Kẹp giấy kim loại', 'Hộp', '22000', 75],
  ['Dụng cụ văn phòng', 'VP-D002', 'Bấm kim số 10', 'Cái', '45000', 30],
  ['Dụng cụ văn phòng', 'VP-D003', 'Kéo văn phòng 17cm', 'Cái', '32000', 8],
  ['Dụng cụ văn phòng', 'VP-D004', 'Băng keo trong 48mm', 'Cuộn', '16000', 100],
  ['Phụ kiện bàn làm việc', 'VP-P001', 'Khay tài liệu 3 tầng', 'Cái', '149000', 20],
  ['Phụ kiện bàn làm việc', 'VP-P002', 'Ống cắm bút tối giản', 'Cái', '55000', 28],
  ['Phụ kiện bàn làm việc', 'VP-P003', 'Bìa hồ sơ A4', 'Cái', '8000', 200],
  ['Phụ kiện bàn làm việc', 'VP-P004', 'Bảng ghi chú để bàn', 'Cái', '119000', 6]
];

export async function seedDatabase() {
  const accountSettings = [
    { email: process.env.SEED_MANAGER_EMAIL, password: process.env.SEED_MANAGER_PASSWORD, name: 'Nguyễn Minh Anh', role: 'MANAGER' },
    { email: process.env.SEED_STAFF_EMAIL, password: process.env.SEED_STAFF_PASSWORD, name: 'Trần Hoàng Nam', role: 'STAFF' }
  ];
  const accounts = [];
  for (const account of accountSettings) {
    if (!account.email || !account.password || account.password.length < 10 || Buffer.byteLength(account.password) > 72 || account.password.startsWith('replace-')) {
      throw new Error('Hãy cấu hình email và mật khẩu demo tối thiểu 10 ký tự, tối đa 72 byte trong .env.');
    }
    const email = account.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.role !== account.role) throw new Error('Email seed đang được dùng cho vai trò khác.');
    accounts.push({ email, name: account.name, role: account.role, passwordHash: existing?.passwordHash ?? await bcrypt.hash(account.password, 12) });
  }

  return withTransaction(async transaction => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(721904)`;
    const users = [];
    for (const account of accounts) {
      users.push(await transaction.user.upsert({ where: { email: account.email }, update: {}, create: account }));
    }
    const manager = users.find(user => user.role === 'MANAGER');
    for (const [categoryName, sku, name, unit, price, stock] of catalog) {
      const category = await transaction.category.upsert({ where: { name: categoryName }, update: {}, create: { name: categoryName } });
      const existing = await transaction.product.findUnique({ where: { sku } });
      if (!existing) {
        await transaction.product.create({ data: {
          sku, name, unit, price, stock, categoryId: category.id,
          movements: { create: { actorId: manager.id, kind: 'OPENING', delta: stock, quantityAfter: stock, reason: 'Tồn đầu kỳ dữ liệu demo', operationKey: `seed:opening:${sku}` } }
        } });
      }
    }
    const customers = [
      ['Nguyễn Thu Hà', '0901000001', 'Quận 3, TP. Hồ Chí Minh'],
      ['Lê Quốc Bảo', '0901000002', 'Bình Thạnh, TP. Hồ Chí Minh'],
      ['Phạm Ngọc Linh', '0901000003', 'Thủ Đức, TP. Hồ Chí Minh'],
      ['Trần Gia Huy', '0901000004', 'Quận 7, TP. Hồ Chí Minh'],
      ['Võ Minh Thư', '0901000005', 'Tân Bình, TP. Hồ Chí Minh'],
      ['Công ty An Phát', '0901000006', 'Quận 1, TP. Hồ Chí Minh']
    ];
    for (const [name, phone, address] of customers) await transaction.customer.upsert({ where: { phone }, update: {}, create: { name, phone, address } });
    const startsAt = new Date(Date.now() - 365 * 86400000);
    const endsAt = new Date(Date.now() + 365 * 86400000);
    await transaction.promotion.upsert({ where: { code: 'CHAO10' }, update: {}, create: { code: 'CHAO10', name: 'Ưu đãi mua sắm 10%', discountType: 'PERCENT', discountValue: '10', minSubtotal: '100000', maxDiscount: '50000', startsAt, endsAt } });
    await transaction.promotion.upsert({ where: { code: 'TIETKIEM20' }, update: {}, create: { code: 'TIETKIEM20', name: 'Giảm 20.000đ cho đơn từ 250.000đ', discountType: 'FIXED', discountValue: '20000', minSubtotal: '250000', startsAt, endsAt } });
    return { users: users.length, products: catalog.length };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await seedDatabase();
    const sales = await seedDemoSales();
    console.log(`Seed hoàn tất: ${result.users} tài khoản, ${result.products} sản phẩm, ${sales} hóa đơn demo mới. Dữ liệu hiện có được giữ nguyên.`);
  } finally { await prisma.$disconnect(); }
}
