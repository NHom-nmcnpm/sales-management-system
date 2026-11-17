import * as service from './auth.service.js';
import { prisma } from '../../prisma/client.js';
import { cookieOptions, sessionCookie } from '../../middlewares/authenticate.js';

export async function login(request, response) {
  const { token, expiresAt, ...data } = await service.login(request.validated.body);
  response.cookie(sessionCookie, token, { ...cookieOptions, expires: expiresAt }).json({ data });
}
export function me(request, response) { response.json({ data: { user: request.user, csrfToken: request.session.csrfToken } }); }
export function csrf(request, response) { response.json({ data: { csrfToken: request.session.csrfToken } }); }
export async function logout(request, response) {
  await prisma.authSession.update({ where: { id: request.session.id }, data: { revokedAt: new Date() } });
  response.clearCookie(sessionCookie, cookieOptions).json({ data: { message: 'Đã đăng xuất.' } });
}
export async function profile(request, response) { response.json({ data: await service.updateProfile(request.user.id, request.validated.body) }); }
export async function password(request, response) {
  await service.changePassword(request.user.id, request.validated.body);
  response.clearCookie(sessionCookie, cookieOptions).json({ data: { message: 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.' } });
}
