import { Router } from 'express';
import { requestLimit } from '../../utilities/rate-limit.js';
import { validate, requireIdempotencyKey } from '../../middlewares/validate.js';
import { idParams } from '../../utilities/list-query.js';
import { invoiceCreate, invoiceQuery, keyParams } from './invoices.validators.js';
import * as controller from './invoices.controller.js';
const router = Router();
const checkoutLimit = requestLimit(
  { windowMs: 60000, limit: 120, keyGenerator: (request) => request.user.id },
  'Có nhiều yêu cầu thanh toán. Vui lòng chờ một lát.',
);
router.get('/', validate(invoiceQuery, 'query'), controller.list);
router.get('/by-request/:key', validate(keyParams, 'params'), controller.byRequest);
router.get('/:id', validate(idParams, 'params'), controller.detail);
router.post('/', checkoutLimit, requireIdempotencyKey, validate(invoiceCreate), controller.create);
export default router;
