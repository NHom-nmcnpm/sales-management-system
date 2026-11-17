import request from 'supertest';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { testPassword } from './helpers.js';

export async function loginAs(user) {
  const agent = request.agent(app);
  const response = await agent
    .post('/api/v1/auth/login')
    .set('Origin', env.APP_ORIGIN)
    .send({ email: user.email, password: testPassword });
  if (response.status !== 200) throw new Error(`Fixture login failed: ${response.status}`);
  return {
    agent,
    headers: { Origin: env.APP_ORIGIN, 'X-CSRF-Token': response.body.data.csrfToken },
  };
}
