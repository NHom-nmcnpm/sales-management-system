import { Router } from 'express';
import { requireManager } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { idParams } from '../../utilities/list-query.js';
import {
  employeeCreate,
  employeeUpdate,
  employeeQuery,
  resetPassword,
} from './employees.validators.js';
import * as controller from './employees.controller.js';
const router = Router();
router.use(requireManager);
router.get('/', validate(employeeQuery, 'query'), controller.list);
router.get('/:id', validate(idParams, 'params'), controller.detail);
router.post('/', validate(employeeCreate), controller.create);
router.patch('/:id', validate(idParams, 'params'), validate(employeeUpdate), controller.update);
router.post(
  '/:id/reset-password',
  validate(idParams, 'params'),
  validate(resetPassword),
  controller.reset,
);
export default router;
