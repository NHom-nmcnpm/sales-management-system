import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate, csrfProtection, requireOrigin } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { loginSchema, profileSchema, changePasswordSchema } from './auth.validators.js';
import * as controller from './auth.controller.js';

const router = Router();
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, message: { code: 'RATE_LIMIT', message: 'Bạn đã thử đăng nhập nhiều lần. Vui lòng thử lại sau.' } });
const passwordLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { code: 'RATE_LIMIT', message: 'Vui lòng thử đổi mật khẩu sau.' } });
router.post('/login', loginLimit, requireOrigin, validate(loginSchema), controller.login);
router.use(authenticate, csrfProtection);
router.get('/me', controller.me);
router.get('/csrf', controller.csrf);
router.post('/logout', controller.logout);
router.patch('/profile', validate(profileSchema), controller.profile);
router.post('/change-password', passwordLimit, validate(changePasswordSchema), controller.password);
export default router;
