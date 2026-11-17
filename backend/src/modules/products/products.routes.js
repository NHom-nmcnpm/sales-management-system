import { Router } from 'express';
import { requireManager } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { idParams } from '../../utilities/list-query.js';
import { productCreate, productUpdate, productQuery } from './products.validators.js';
import * as controller from './products.controller.js';
const router = Router();
router.get('/', validate(productQuery, 'query'), controller.list);
router.get('/:id', validate(idParams, 'params'), controller.detail);
router.post('/', requireManager, validate(productCreate), controller.create);
router.patch(
  '/:id',
  requireManager,
  validate(idParams, 'params'),
  validate(productUpdate),
  controller.update,
);
export default router;
