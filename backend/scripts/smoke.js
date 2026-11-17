import { prisma } from '../src/prisma/client.js';
try {
  const result = await prisma.$queryRaw`SELECT 1 AS value`;
  if (result[0].value !== 1) throw new Error('Unexpected database response');
  console.log('Prisma recommended generator + JavaScript + native Node 24 type stripping + PostgreSQL OK');
} finally { await prisma.$disconnect(); }
