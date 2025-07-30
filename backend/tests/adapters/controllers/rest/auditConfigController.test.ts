import request from 'supertest';
import express from 'express';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createAuditConfigRouter } from '../../../../adapters/controllers/rest/auditConfigController';
import { GetAuditConfigUseCase } from '../../../../usecases/audit/GetAuditConfigUseCase';
import { UpdateAuditConfigUseCase } from '../../../../usecases/audit/UpdateAuditConfigUseCase';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { AuditConfig } from '../../../../domain/entities/AuditConfig';
import { User } from '../../../../domain/entities/User';
import { Role } from '../../../../domain/entities/Role';
import { Permission } from '../../../../domain/entities/Permission';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';
import { Site } from '../../../../domain/entities/Site';
import { Department } from '../../../../domain/entities/Department';

describe('AuditConfig REST controller', () => {
  let app: express.Express;
  let getUseCase: DeepMockProxy<GetAuditConfigUseCase>;
  let updateUseCase: DeepMockProxy<UpdateAuditConfigUseCase>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let site: Site;
  let dept: Department;
  let role: Role;
  let user: User;

  beforeEach(() => {
    getUseCase = mockDeep<GetAuditConfigUseCase>();
    updateUseCase = mockDeep<UpdateAuditConfigUseCase>();
    logger = mockDeep<LoggerPort>();
    site = new Site('s', 'Site');
    dept = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role', [new Permission('p', PermissionKeys.READ_AUDIT_CONFIG, '')]);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);

    app = express();
    app.use(express.json());
    app.use('/api', (req, _res, next) => { (req as any).user = user; next(); });
    app.use('/api', createAuditConfigRouter(getUseCase, updateUseCase, logger));
  });

  it('should return audit config', async () => {
    const cfg = new AuditConfig(1, ['info'], ['auth'], new Date('2024-01-01T00:00:00Z'), 'u');
    getUseCase.execute.mockResolvedValue(cfg);

    const res = await request(app).get('/api/audit/config');

    expect(res.status).toBe(200);
    expect(res.body.levels).toEqual(['info']);
  });

  it('should return 204 when none', async () => {
    getUseCase.execute.mockResolvedValue(null);

    const res = await request(app).get('/api/audit/config');

    expect(res.status).toBe(204);
  });

  it('should forbid when read permission missing', async () => {
    role.permissions = [];

    const res = await request(app).get('/api/audit/config');

    expect(res.status).toBe(403);
  });

  it('should update audit config', async () => {
    role.permissions.push(new Permission('p2', PermissionKeys.WRITE_AUDIT_CONFIG, ''));
    const cfg = new AuditConfig(1, ['warn'], ['system'], new Date('2024-01-02T00:00:00Z'), 'u');
    updateUseCase.execute.mockResolvedValue(cfg);

    const res = await request(app)
      .put('/api/audit/config')
      .send({ levels: ['warn'], categories: ['system'], updatedBy: 'u' });

    expect(res.status).toBe(200);
    expect(updateUseCase.execute).toHaveBeenCalledWith(
      ['warn'],
      ['system'],
      'u',
    );
  });

  it('should forbid update without permission', async () => {
    role.permissions = [];

    const res = await request(app)
      .put('/api/audit/config')
      .send({ levels: [], categories: [], updatedBy: 'u' });

    expect(res.status).toBe(403);
  });

  it('should return 400 when service fails', async () => {
    role.permissions.push(new Permission('p2', PermissionKeys.WRITE_AUDIT_CONFIG, ''));
    updateUseCase.execute.mockRejectedValue(new Error('boom'));

    const res = await request(app)
      .put('/api/audit/config')
      .send({ levels: [], categories: [], updatedBy: 'u' });

    expect(res.status).toBe(400);
    expect(logger.warn).toHaveBeenCalled();
  });
});
