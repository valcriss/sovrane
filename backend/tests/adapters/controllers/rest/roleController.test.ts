import request from 'supertest';
import express from 'express';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createRoleRouter } from '../../../../adapters/controllers/rest/roleController';
import { RoleRepositoryPort } from '../../../../domain/ports/RoleRepositoryPort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { Role } from '../../../../domain/entities/Role';
import { Permission } from '../../../../domain/entities/Permission';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';
import { User } from '../../../../domain/entities/User';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';

describe('Role REST controller', () => {
  let app: express.Express;
  let roleRepo: DeepMockProxy<RoleRepositoryPort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let role: Role;
  let permission: Permission;
  let user: User;
  let site: Site;
  let dept: Department;

  beforeEach(() => {
    roleRepo = mockDeep<RoleRepositoryPort>();
    userRepo = mockDeep<UserRepositoryPort>();
    logger = mockDeep<LoggerPort>();
    permission = new Permission('p', 'P', 'desc');
    role = new Role('r', 'Role', [permission]);
    roleRepo.create.mockResolvedValue(role);
    roleRepo.update.mockResolvedValue(role);
    userRepo.findByRoleId.mockResolvedValue([]);
    roleRepo.delete.mockResolvedValue();

    site = new Site('s', 'Site');
    dept = new Department('d', 'Dept', null, null, site);
    const rootPerm = new Permission('root', PermissionKeys.ROOT, 'root');
    const adminRole = new Role('admin', 'Admin', [rootPerm]);
    user = new User('u', 'John', 'Doe', 'john@example.com', [adminRole], 'active', dept, site);

    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).user = user;
      next();
    });
    app.use('/api', createRoleRouter(roleRepo, userRepo, logger));
  });

  it('should list roles', async () => {
    roleRepo.findPage.mockResolvedValue({ items: [role], page: 1, limit: 20, total: 1 });

    const res = await request(app).get('/api/roles?page=1&limit=20');

    expect(res.status).toBe(200);
    expect(res.body.items[0].id).toBe('r');
    expect(roleRepo.findPage).toHaveBeenCalledWith({ page: 1, limit: 20, filters: { search: undefined } });
  });

  it('should return 204 when no roles found', async () => {
    roleRepo.findPage.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });

    const res = await request(app).get('/api/roles?page=1&limit=20');

    expect(res.status).toBe(204);
  });

  it('should get role by id', async () => {
    roleRepo.findById.mockResolvedValue(role);

    const res = await request(app).get('/api/roles/r');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('r');
    expect(roleRepo.findById).toHaveBeenCalledWith('r');
  });

  it('should create a role', async () => {
    const res = await request(app)
      .post('/api/roles')
      .send({
        id: 'r',
        label: 'Role',
        permissions: [{ id: 'p', permissionKey: 'P', description: 'desc' }],
      });

    expect(res.status).toBe(201);
    expect(roleRepo.create).toHaveBeenCalled();
  });

  it('should update a role', async () => {
    const res = await request(app)
      .put('/api/roles/r')
      .send({
        label: 'Role',
        permissions: [{ id: 'p', permissionKey: 'P', description: 'desc' }],
      });

    expect(res.status).toBe(200);
    expect(roleRepo.update).toHaveBeenCalled();
  });

  it('should delete a role', async () => {
    const res = await request(app).delete('/api/roles/r');

    expect(res.status).toBe(204);
    expect(roleRepo.delete).toHaveBeenCalledWith('r');
  });

  it('should return 400 when deletion fails', async () => {
    userRepo.findByRoleId.mockResolvedValueOnce([{} as any]);

    const res = await request(app).delete('/api/roles/r');

    expect(res.status).toBe(400);
    expect(roleRepo.delete).not.toHaveBeenCalled();
  });
  it('should list roles with default pagination', async () => {
    roleRepo.findPage.mockResolvedValue({ items: [role], page: 1, limit: 20, total: 1 });
    const res = await request(app).get('/api/roles');
    expect(res.status).toBe(200);
    expect(roleRepo.findPage).toHaveBeenCalledWith({ page: 1, limit: 20, filters: { search: undefined } });
  });

  it('should return 404 when role not found', async () => {
    roleRepo.findById.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/roles/unknown');
    expect(res.status).toBe(404);
  });

});
