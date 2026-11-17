import bcrypt from 'bcrypt';
import { prisma } from '../../prisma/client.js';
import { publicUserFields } from '../../middlewares/authenticate.js';
import { listOptions, listResult } from '../../utilities/list-query.js';
import { withTransaction } from '../../utilities/transaction.js';

export async function listEmployees(query) {
  const where = {
    role: 'STAFF',
    OR: [
      { name: { contains: query.q, mode: 'insensitive' } },
      { email: { contains: query.q, mode: 'insensitive' } },
    ],
  };
  if (query.isActive) where.isActive = query.isActive === 'true';
  const [rows, total] = await Promise.all([
    prisma.user.findMany({ where, select: publicUserFields, ...listOptions(query) }),
    prisma.user.count({ where }),
  ]);
  return listResult(rows, total, query);
}
export function getEmployee(id) {
  return prisma.user.findUniqueOrThrow({ where: { id, role: 'STAFF' }, select: publicUserFields });
}
export async function createEmployee({ password, ...data }) {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: { ...data, passwordHash, role: 'STAFF' },
    select: publicUserFields,
  });
}
export function updateEmployee(id, data) {
  return withTransaction(async (transaction) => {
    const user = await transaction.user.update({
      where: { id, role: 'STAFF' },
      data,
      select: publicUserFields,
    });
    if (data.isActive === false)
      await transaction.authSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    return user;
  });
}
export async function resetEmployeePassword(id, password) {
  const passwordHash = await bcrypt.hash(password, 12);
  await withTransaction(async (transaction) => {
    await transaction.user.update({ where: { id, role: 'STAFF' }, data: { passwordHash } });
    await transaction.authSession.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });
}
