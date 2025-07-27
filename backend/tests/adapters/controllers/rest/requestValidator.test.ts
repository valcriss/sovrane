import express from 'express';
import request from 'supertest';
import { requireBodyParams } from '../../../../adapters/controllers/rest/requestValidator';

describe('requestValidator', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  it('accepts valid int, float and bool parameters', async () => {
    app.post(
      '/ok',
      requireBodyParams({
        count: { validator: 'int', min: 1, max: 5 },
        ratio: { validator: 'float', min: 0.5, max: 2 },
        active: { validator: 'bool' },
      }),
      (_req, res) => res.status(200).end(),
    );

    await request(app)
      .post('/ok')
      .send({ count: 2, ratio: 1.2, active: true })
      .expect(200);
  });

  it('rejects invalid parameter values', async () => {
    app.post(
      '/bad',
      requireBodyParams({
        count: { validator: 'int', min: 2 },
        ratio: { validator: 'float', max: 1 },
        active: { validator: 'bool' },
      }),
      (_req, res) => res.status(200).end(),
    );

    const res = await request(app)
      .post('/bad')
      .send({ count: 1, ratio: 2, active: 'yes' });
    expect(res.status).toBe(422);
    expect(res.body.error).toContain('count');
    expect(res.body.error).toContain('ratio');
    expect(res.body.error).toContain('active');
  });

  it('allows unknown validator types', async () => {
    app.post(
      '/unknown',
      requireBodyParams({ foo: { validator: 'custom' as any } }),
      (_req, res) => res.status(200).end(),
    );

    await request(app).post('/unknown').send({ foo: 'bar' }).expect(200);
  });

  it('validates string and email rules', async () => {
    app.post(
      '/string',
      requireBodyParams({
        name: { validator: 'string', minLength: 2, maxLength: 3 },
        email: { validator: 'email' },
      }),
      (_req, res) => res.status(200).end(),
    );

    await request(app)
      .post('/string')
      .send({ name: 'abc', email: 'x@y.z' })
      .expect(200);

    const res = await request(app)
      .post('/string')
      .send({ name: 'a', email: 'invalid' });
    expect(res.status).toBe(422);
  });

  it('returns 400 when required parameters are missing', async () => {
    app.post(
      '/missing',
      requireBodyParams(['foo', 'bar']),
      (_req, res) => res.status(200).end(),
    );

    const res = await request(app).post('/missing').send({ foo: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('bar');
  });

  it('rejects wrong parameter types and lengths', async () => {
    app.post(
      '/types',
      requireBodyParams({
        count: { validator: 'int' },
        ratio: { validator: 'float' },
        name: { validator: 'string', maxLength: 3 },
        email: { validator: 'email' },
      }),
      (_req, res) => res.status(200).end(),
    );

    const res = await request(app)
      .post('/types')
      .send({ count: 1.1, ratio: 'foo', name: 'abcd', email: 3 });
    expect(res.status).toBe(422);
    expect(res.body.error).toContain('count');
    expect(res.body.error).toContain('ratio');
    expect(res.body.error).toContain('name');
    expect(res.body.error).toContain('email');
  });

  it('accepts requests when array-based schema is satisfied', async () => {
    app.post(
      '/array-ok',
      requireBodyParams(['foo', 'bar']),
      (_req, res) => res.status(200).end(),
    );

    await request(app).post('/array-ok').send({ foo: 1, bar: 2 }).expect(200);
  });

  it('validates max and type constraints', async () => {
    app.post(
      '/limits',
      requireBodyParams({
        age: { validator: 'int', max: 3 },
        rate: { validator: 'float', min: 1 },
        title: { validator: 'string' },
      }),
      (_req, res) => res.status(200).end(),
    );

    const res = await request(app)
      .post('/limits')
      .send({ age: 4, rate: 0.5, title: 5 });
    expect(res.status).toBe(422);
    expect(res.body.error).toContain('age');
    expect(res.body.error).toContain('rate');
    expect(res.body.error).toContain('title');
  });
});
