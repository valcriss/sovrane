import request from 'supertest';
import express from 'express';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createConfigRouter } from '../../../../adapters/controllers/rest/configController';
import { GetConfigUseCase } from '../../../../usecases/config/GetConfigUseCase';
import { UpdateConfigUseCase } from '../../../../usecases/config/UpdateConfigUseCase';
import { DeleteConfigUseCase } from '../../../../usecases/config/DeleteConfigUseCase';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { User } from '../../../../domain/entities/User';
import { Role } from '../../../../domain/entities/Role';
import { Permission } from '../../../../domain/entities/Permission';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';
import { Site } from '../../../../domain/entities/Site';
import { Department } from '../../../../domain/entities/Department';

describe('Config REST controller', () => {
  let app: express.Express;
  let getUseCase: DeepMockProxy<GetConfigUseCase>;
  let updateUseCase: DeepMockProxy<UpdateConfigUseCase>;
  let deleteUseCase: DeepMockProxy<DeleteConfigUseCase>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let site: Site;
  let dept: Department;
  let role: Role;
  let user: User;

  beforeEach(() => {
    getUseCase = mockDeep<GetConfigUseCase>();
    updateUseCase = mockDeep<UpdateConfigUseCase>();
    deleteUseCase = mockDeep<DeleteConfigUseCase>();
    logger = mockDeep<LoggerPort>();
    site = new Site('s', 'Site');
    dept = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role', [new RolePermissionAssignment(new Permission('p', PermissionKeys.READ_CONFIG, ''))]);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);

    app = express();
    app.use(express.json());
    app.use('/api', (req, _res, next) => { (req as any).user = user; next(); });
    app.use('/api', createConfigRouter(getUseCase, updateUseCase, deleteUseCase, logger));
  });

  it('should return configuration value', async () => {
    getUseCase.execute.mockResolvedValue('v');

    const res = await request(app).get('/api/config/key');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ key: 'key', value: 'v' });
  });

  it('should return 404 when entry missing', async () => {
    getUseCase.execute.mockResolvedValue(null);

    const res = await request(app).get('/api/config/missing');

    expect(res.status).toBe(404);
  });

  it('should forbid when read permission missing', async () => {
    role.permissions = [];

    const res = await request(app).get('/api/config/key');

    expect(res.status).toBe(403);
  });

  it('should update configuration value', async () => {
    role.permissions.push(new UserPermissionAssignment(new Permission('p2', PermissionKeys.UPDATE_CONFIG, '')));
    updateUseCase.execute.mockResolvedValue();

    const res = await request(app)
      .put('/api/config/key')
      .send({ value: 'v', updatedBy: 'u' });

    expect(res.status).toBe(204);
    expect(updateUseCase.execute).toHaveBeenCalledWith('key', 'v', 'u');
  });

  it('should forbid update when permission missing', async () => {
    role.permissions = [];

    const res = await request(app)
      .put('/api/config/key')
      .send({ value: 'v', updatedBy: 'u' });

    expect(res.status).toBe(403);
  });

  it('should delete configuration value', async () => {
    role.permissions.push(new UserPermissionAssignment(new Permission('p3', PermissionKeys.DELETE_CONFIG, '')));
    deleteUseCase.execute.mockResolvedValue();

    const res = await request(app)
      .delete('/api/config/key')
      .send({ deletedBy: 'u' });

    expect(res.status).toBe(204);
    expect(deleteUseCase.execute).toHaveBeenCalledWith('key', 'u');
  });

  it('should forbid delete when permission missing', async () => {
    role.permissions = [];

    const res = await request(app)
      .delete('/api/config/key')
      .send({ deletedBy: 'u' });

    expect(res.status).toBe(403);
  });

  it('should return 400 when delete use case fails', async () => {
    role.permissions.push(new UserPermissionAssignment(new Permission('p3', PermissionKeys.DELETE_CONFIG, '')));
    deleteUseCase.execute.mockRejectedValue(new Error('boom'));

    const res = await request(app)
      .delete('/api/config/key')
      .send({ deletedBy: 'u' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'boom' });
    expect(logger.warn).toHaveBeenCalled();
  });
});
