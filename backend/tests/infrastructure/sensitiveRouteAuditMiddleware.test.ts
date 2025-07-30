import express from 'express';
import request from 'supertest';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createSensitiveRouteAuditMiddleware } from '../../infrastructure/sensitiveRouteAuditMiddleware';
import { AuditPort } from '../../domain/ports/AuditPort';
import { AuthServicePort } from '../../domain/ports/AuthServicePort';
import { GetConfigUseCase } from '../../usecases/config/GetConfigUseCase';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { AuditEvent } from '../../domain/entities/AuditEvent';
import { AuditEventType } from '../../domain/entities/AuditEventType';

describe('sensitive route audit middleware', () => {
  let audit: DeepMockProxy<AuditPort>;
  let auth: DeepMockProxy<AuthServicePort>;
  let config: DeepMockProxy<GetConfigUseCase>;
  let logger: DeepMockProxy<LoggerPort>;
  let app: express.Express;

  beforeEach(() => {
    audit = mockDeep<AuditPort>();
    auth = mockDeep<AuthServicePort>();
    config = mockDeep<GetConfigUseCase>();
    logger = mockDeep<LoggerPort>();

    config.execute.mockResolvedValue(['/api/admin/*']);
    auth.verifyToken.mockResolvedValue({ id: 'u' } as any);

    app = express();
    app.use(createSensitiveRouteAuditMiddleware(audit, auth, config, logger));
    app.get('/api/admin/data', (_req, res) => res.json({ ok: true }));
    app.get('/open', (_req, res) => res.json({ ok: true }));
  });

  it('should log when a sensitive route is accessed', async () => {
    const res = await request(app)
      .get('/api/admin/data')
      .set('Authorization', 'Bearer t');

    expect(res.status).toBe(200);
    expect(audit.log).toHaveBeenCalledTimes(1);
    const event = audit.log.mock.calls[0][0] as AuditEvent;
    expect(event.action).toBe(AuditEventType.SENSITIVE_ROUTE_ACCESSED);
    expect(event.actorId).toBe('u');
    expect(event.details).toEqual({ method: 'GET', path: '/api/admin/data', ip: expect.any(String) });
    expect(config.execute).toHaveBeenCalledTimes(1);

    await request(app).get('/api/admin/data');
    expect(config.execute).toHaveBeenCalledTimes(1);
  });

  it('should ignore non matching routes', async () => {
    await request(app).get('/open');
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('should handle invalid tokens', async () => {
    auth.verifyToken.mockRejectedValue(new Error('bad'));
    await request(app)
      .get('/api/admin/data')
      .set('Authorization', 'Bearer bad');
    const event = audit.log.mock.calls[0][0] as AuditEvent;
    expect(event.actorId).toBeNull();
  });

  it('should handle missing authorization header', async () => {
    await request(app).get('/api/admin/data');
    const event = audit.log.mock.calls[0][0] as AuditEvent;
    expect(event.actorId).toBeNull();
  });

  it('should use default patterns when config missing', async () => {
    const cfg = mockDeep<GetConfigUseCase>();
    cfg.execute.mockResolvedValue(null);
    const inst = express();
    inst.use(createSensitiveRouteAuditMiddleware(audit, auth, cfg, logger));
    inst.get('/api/audit', (_req, res) => res.json({ ok: true }));
    await request(inst).get('/api/audit');
    expect(audit.log).toHaveBeenCalled();
  });
});
