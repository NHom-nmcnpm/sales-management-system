import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Health endpoint', () => {
  it('returns liveness without leaking configuration', async () => {
    const response = await request(app).get('/api/v1/health/live');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: 'ok' } });
  });
});
