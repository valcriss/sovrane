import request from 'supertest';
import express from 'express';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createAuditRouter } from '../../../../adapters/controllers/rest/auditController';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { AuditPort } from '../../../../domain/ports/AuditPort';
import { AuditConfigService } from '../../../../domain/services/AuditConfigService';
import { GetAuditConfigUseCase } from '../../../../usecases/audit/GetAuditConfigUseCase';
import { UpdateAuditConfigUseCase } from '../../../../usecases/audit/UpdateAuditConfigUseCase';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { AuditConfig } from '../../../../domain/entities/AuditConfig';
import { User } from '../../../../domain/entities/User';
import { Role } from '../../../../domain/entities/Role';
import { Permission } from '../../../../domain/entities/Permission';
import { RolePermissionAssignment } from '../../../../domain/entities/RolePermissionAssignment';
import { UserPermissionAssignment } from '../../../../domain/entities/UserPermissionAssignment';
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
  let auth: DeepMockProxy<AuthServicePort>;
  let users: DeepMockProxy<UserRepositoryPort>;
  let audit: DeepMockProxy<AuditPort>;
  let config: DeepMockProxy<AuditConfigService>;

  beforeEach(() => {
    auth = mockDeep<AuthServicePort>();
    users = mockDeep<UserRepositoryPort>();
    audit = mockDeep<AuditPort>();
    getUseCase = mockDeep<GetAuditConfigUseCase>();
    updateUseCase = mockDeep<UpdateAuditConfigUseCase>();
    logger = mockDeep<LoggerPort>();
    config = mockDeep<AuditConfigService>();
    site = new Site('s', 'Site');
    dept = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role', [new RolePermissionAssignment(new Permission('p', PermissionKeys.READ_AUDIT_CONFIG, ''))]);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);

    auth.verifyToken.mockResolvedValue({ id: 'u' } as any);
    users.findById.mockResolvedValue(user);

    app = express();
    app.use(express.json());
    app.use('/api', createAuditRouter(auth, users, audit, logger, config, getUseCase, updateUseCase));
  });

  it('should return audit config', async () => {
    const cfg = new AuditConfig(1, ['info'], ['auth'], new Date('2024-01-01T00:00:00Z'), 'u');
    getUseCase.execute.mockResolvedValue(cfg);

    const res = await request(app)
      .get('/api/audit/config')
      .set('Authorization', 'Bearer t');

    expect(res.status).toBe(200);
    expect(res.body.levels).toEqual(['info']);
  });

  it('should return 204 when none', async () => {
    getUseCase.execute.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/audit/config')
      .set('Authorization', 'Bearer t');

    expect(res.status).toBe(204);
  });

  it('should forbid when read permission missing', async () => {
    role.permissions = [];

    const res = await request(app)
      .get('/api/audit/config')
      .set('Authorization', 'Bearer t');

    expect(res.status).toBe(403);
  });

  it('should update audit config', async () => {
    role.permissions.push(new UserPermissionAssignment(new Permission('p2', PermissionKeys.WRITE_AUDIT_CONFIG, '')));
    const cfg = new AuditConfig(1, ['warn'], ['system'], new Date('2024-01-02T00:00:00Z'), 'u');
    updateUseCase.execute.mockResolvedValue(cfg);

    const res = await request(app)
      .put('/api/audit/config')
      .set('Authorization', 'Bearer t')
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
      .set('Authorization', 'Bearer t')
      .send({ levels: [], categories: [], updatedBy: 'u' });

    expect(res.status).toBe(403);
  });

  it('should return 400 when service fails', async () => {
    role.permissions.push(new UserPermissionAssignment(new Permission('p2', PermissionKeys.WRITE_AUDIT_CONFIG, '')));
    updateUseCase.execute.mockRejectedValue(new Error('boom'));

    const res = await request(app)
      .put('/api/audit/config')
      .set('Authorization', 'Bearer t')
      .send({ levels: [], categories: [], updatedBy: 'u' });

    expect(res.status).toBe(400);
    expect(logger.warn).toHaveBeenCalled();
  });
});
