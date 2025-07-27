import request from 'supertest';
import express from 'express';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createAuditRouter } from '../../../../adapters/controllers/rest/auditController';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { AuditPort } from '../../../../domain/ports/AuditPort';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { AuditEvent } from '../../../../domain/entities/AuditEvent';
import { User } from '../../../../domain/entities/User';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';
import { Role } from '../../../../domain/entities/Role';
import { Permission } from '../../../../domain/entities/Permission';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';

describe('Audit REST controller', () => {
  let app: express.Express;
  let auth: DeepMockProxy<AuthServicePort>;
  let users: DeepMockProxy<UserRepositoryPort>;
  let audit: DeepMockProxy<AuditPort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;

  beforeEach(() => {
    auth = mockDeep<AuthServicePort>();
    users = mockDeep<UserRepositoryPort>();
    audit = mockDeep<AuditPort>();
    logger = mockDeep<LoggerPort>();

    auth.verifyToken.mockResolvedValue({ id: 'u' } as any);
    const site = new Site('s', 'Site');
    const dept = new Department('d', 'Dept', null, null, site);
    const perm = new Permission('p', PermissionKeys.VIEW_AUDIT_LOGS, '');
    const role = new Role('r', 'Role', [perm]);
    const user = new User('u', 'John', 'Doe', 'j@example.com', [role], 'active', dept, site);
    users.findById.mockResolvedValue(user);

    app = express();
    app.use(express.json());
    app.use('/api', createAuditRouter(auth, users, audit, logger));
  });

  it('should list audit logs', async () => {
    const event = new AuditEvent(new Date('2024-01-01T00:00:00Z'), 'u', 'user', 'action');
    audit.findPaginated.mockResolvedValue({ items: [event], page: 1, limit: 20, total: 1 });

    const res = await request(app)
      .get('/api/audit?page=1&limit=20')
      .set('Authorization', 'Bearer t');

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(audit.findPaginated).toHaveBeenCalled();
  });

  it('should return 204 when no logs', async () => {
    audit.findPaginated.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });

    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', 'Bearer t');

    expect(res.status).toBe(204);
  });

  it('should reject unauthorized requests', async () => {
    auth.verifyToken.mockRejectedValue(new Error('bad'));

    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', 'Bearer bad');

    expect(res.status).toBe(401);
  });

  it('should reject requests without header', async () => {
    const res = await request(app).get('/api/audit');
    expect(res.status).toBe(401);
  });

  it('should reject when user not found', async () => {
    users.findById.mockResolvedValueOnce(null);
    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', 'Bearer t');
    expect(res.status).toBe(401);
  });
});

