import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { prisma } from '../prisma/client.js';
import { HttpError } from '../utilities/http-error.js';

export const publicUserFields = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
};
export const sessionCookie = 'sales_session';
export const cookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  path: '/',
};

export async function authenticate(request, _response, next) {
  const token = request.cookies[sessionCookie];
  if (!token) throw new HttpError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập để tiếp tục.');
  let claims;
  try {
    claims = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'sales-management',
      audience: 'sales-web',
    });
  } catch {
    throw new HttpError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập đã hết hạn.');
  }
  if (
    typeof claims !== 'object' ||
    typeof claims.sid !== 'string' ||
    typeof claims.sub !== 'string'
  )
    throw new HttpError(401, 'UNAUTHENTICATED', 'Phiên đăng nhập không hợp lệ.');
  const session = await prisma.authSession.findUnique({
    where: { id: claims.sid },
    include: { user: { select: publicUserFields } },
  });
  if (
    !session ||
    session.userId !== claims.sub ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    !session.user.isActive
  ) {
    throw new HttpError(
      401,
      'SESSION_EXPIRED',
      'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.',
    );
  }
  request.user = session.user;
  request.session = session;
  next();
}

export function requireManager(request, _response, next) {
  if (request.user.role !== 'MANAGER')
    throw new HttpError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.');
  next();
}

export function requireOrigin(request, _response, next) {
  if (request.get('origin') !== env.APP_ORIGIN)
    throw new HttpError(403, 'ORIGIN_REJECTED', 'Nguồn yêu cầu không được phép.');
  if (!request.is('application/json'))
    throw new HttpError(400, 'JSON_REQUIRED', 'Yêu cầu phải dùng application/json.');
  next();
}

export function csrfProtection(request, response, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next();
  requireOrigin(request, response, () => {});
  const token = request.get('x-csrf-token') ?? '';
  const expected = request.session.csrfToken;
  if (
    Buffer.byteLength(token) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  ) {
    throw new HttpError(403, 'CSRF_REJECTED', 'Phiên xác nhận không hợp lệ. Hãy tải lại trang.');
  }
  next();
}
