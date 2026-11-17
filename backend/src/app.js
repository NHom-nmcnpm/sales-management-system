import express, { Router } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import { prisma } from './prisma/client.js';
import { env } from './config/env.js';
import { HttpError } from './utilities/http-error.js';
import { errorHandler } from './middlewares/error-handler.js';
import authRoutes from './modules/auth/auth.routes.js';
import categoriesRoutes from './modules/categories/categories.routes.js';
import productsRoutes from './modules/products/products.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import employeesRoutes from './modules/employees/employees.routes.js';
import customersRoutes from './modules/customers/customers.routes.js';
import promotionsRoutes from './modules/promotions/promotions.routes.js';
import salesRoutes from './modules/sales/sales.routes.js';
import invoicesRoutes from './modules/invoices/invoices.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import { authenticate, csrfProtection } from './middlewares/authenticate.js';

export const app = express();
app.use(helmet());
app.disable('x-powered-by');
app.use((request, response, next) => {
  request.id = randomUUID();
  response.set('X-Request-Id', request.id);
  response.set('Cache-Control', 'no-store');
  next();
});
app.use(cors({ origin: env.APP_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));
app.get('/api/v1/health/live', (_request, response) => response.json({ data: { status: 'ok' } }));
app.get('/api/v1/health/ready', async (_request, response, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ data: { status: 'ready' } });
  } catch { next(new HttpError(503, 'UNAVAILABLE', 'Database tạm thời chưa sẵn sàng.')); }
});
app.use('/api/v1/auth', authRoutes);
const protectedRoutes = Router();
protectedRoutes.use(authenticate, csrfProtection);
protectedRoutes.use('/categories', categoriesRoutes);
protectedRoutes.use('/products', productsRoutes);
protectedRoutes.use('/inventory', inventoryRoutes);
protectedRoutes.use('/employees', employeesRoutes);
protectedRoutes.use('/customers', customersRoutes);
protectedRoutes.use('/promotions', promotionsRoutes);
protectedRoutes.use('/sales', salesRoutes);
protectedRoutes.use('/invoices', invoicesRoutes);
protectedRoutes.use('/reports', reportsRoutes);
app.use('/api/v1', protectedRoutes);
app.use((_request, _response, next) => next(new HttpError(404, 'NOT_FOUND', 'Không tìm thấy API.')));
app.use(errorHandler);
