import { prisma } from '../prisma/client.js';
import { setTimeout } from 'node:timers/promises';

export async function withTransaction(callback) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(callback, {
        isolationLevel: 'Serializable',
        maxWait: 5000,
        timeout: 10000,
      });
    } catch (error) {
      if (error.code !== 'P2034' || attempt === 2) throw error;
      await setTimeout(25 * (attempt + 1) + Math.floor(Math.random() * 20));
    }
  }
}
