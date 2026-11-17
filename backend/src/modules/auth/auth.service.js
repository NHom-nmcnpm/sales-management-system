import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { prisma } from '../../prisma/client.js';
import { env } from '../../config/env.js';
import { publicUserFields } from '../../middlewares/authenticate.js';
import { HttpError } from '../../utilities/http-error.js';

const dummyHash = bcrypt.hashSync(randomBytes(24).toString('hex'), 12);
const sessionDuration = 8 * 60 * 60 * 1000;

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  const matches = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);
  if (!user || !matches || !user.isActive)
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.');
  const expiresAt = new Date(Date.now() + sessionDuration);
  const session = await prisma.authSession.create({
    data: { userId: user.id, csrfToken: randomBytes(32).toString('hex'), expiresAt },
  });
  const token = jwt.sign({ sid: session.id }, env.JWT_SECRET, {
    subject: user.id,
    algorithm: 'HS256',
    issuer: 'sales-management',
    audience: 'sales-web',
    expiresIn: '8h',
  });
  const safeUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: publicUserFields,
  });
  return { token, expiresAt, user: safeUser, csrfToken: session.csrfToken };
}

export function updateProfile(userId, data) {
  return prisma.user.update({ where: { id: userId }, data, select: publicUserFields });
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!(await bcrypt.compare(currentPassword, user.passwordHash)))
    throw new HttpError(400, 'WRONG_PASSWORD', 'Mật khẩu hiện tại không đúng.', {
      currentPassword: 'Mật khẩu hiện tại không đúng.',
    });
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}
