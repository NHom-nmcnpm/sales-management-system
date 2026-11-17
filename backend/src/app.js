import express from 'express';
import helmet from 'helmet';
import { prisma } from './prisma/client.js';

export const app = express();
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.get('/api/v1/health/live', (_request, response) => response.json({ data: { status: 'ok' } }));
app.get('/api/v1/health/ready', async (_request, response, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ data: { status: 'ready' } });
  } catch (error) { next(error); }
});
app.use((_request, response) => response.status(404).json({ code: 'NOT_FOUND', message: 'Không tìm thấy API.' }));
app.use((_error, _request, response, _next) => response.status(503).json({ code: 'UNAVAILABLE', message: 'Dịch vụ tạm thời chưa sẵn sàng.' }));
