import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { saleInput } from './sales.validators.js';
import { quote } from './sales.controller.js';
const router = Router();
router.post('/quote', validate(saleInput), quote);
export default router;
