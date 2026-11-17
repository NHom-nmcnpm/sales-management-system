import { Router } from 'express';
import { requestLimit } from '../../utilities/rate-limit.js';
import { authenticate, csrfProtection, requireOrigin } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { loginSchema, profileSchema, changePasswordSchema } from './auth.validators.js';
import * as controller from './auth.controller.js';

const router = Router();
const loginLimit = requestLimit(
  { windowMs: 15 * 60 * 1000, limit: 20, skipSuccessfulRequests: true },
  'Bạn đã thử đăng nhập nhiều lần. Vui lòng thử lại sau.',
);
const passwordLimit = requestLimit(
  { windowMs: 15 * 60 * 1000, limit: 10 },
  'Vui lòng thử đổi mật khẩu sau.',
);
router.post('/login', loginLimit, requireOrigin, validate(loginSchema), controller.login);
router.use(authenticate, csrfProtection);
router.get('/me', controller.me);
router.get('/csrf', controller.csrf);
router.post('/logout', controller.logout);
router.patch('/profile', validate(profileSchema), controller.profile);
router.post('/change-password', passwordLimit, validate(changePasswordSchema), controller.password);
export default router;
