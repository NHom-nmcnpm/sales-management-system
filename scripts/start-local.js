import dotenv from 'dotenv';

dotenv.config({ quiet: true });
process.env.NODE_ENV = 'production';
process.env.APP_ORIGIN = process.env.START_ORIGIN ?? `http://localhost:${process.env.PORT ?? 3000}`;
await import('../backend/src/server.js');
