import request from 'supertest';
import express from 'express';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createDepartmentRouter } from '../../../../adapters/controllers/rest/departmentController';
import { DepartmentRepositoryPort } from '../../../../domain/ports/DepartmentRepositoryPort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';
import { Permission } from '../../../../domain/entities/Permission';
import { User } from '../../../../domain/entities/User';
import { Role } from '../../../../domain/entities/Role';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';

describe('Department REST controller', () => {
  let app: express.Express;
  let deptRepo: DeepMockProxy<DepartmentRepositoryPort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let site: Site;
  let department: Department;
  let permission: Permission;
  let user: User;
  let role: Role;

  beforeEach(() => {
    deptRepo = mockDeep<DepartmentRepositoryPort>();
    userRepo = mockDeep<UserRepositoryPort>();
    logger = mockDeep<LoggerPort>();
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    permission = new Permission('p', PermissionKeys.UPDATE_DEPARTMENT, 'desc');
    role = new Role('r', 'Role', [permission]);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    deptRepo.create.mockResolvedValue(department);
    deptRepo.update.mockResolvedValue(department);
    deptRepo.findById.mockResolvedValue(department);
    deptRepo.delete.mockResolvedValue();
    userRepo.findById.mockResolvedValue(user);
    userRepo.update.mockResolvedValue(user);
    userRepo.findByDepartmentId.mockResolvedValue([]);

    app = express();
    app.use(express.json());
    app.use((req, _res, next) => { (req as any).user = user; next(); });
    app.use('/api', createDepartmentRouter(deptRepo, userRepo, logger));
  });

  it('should list departments', async () => {
    deptRepo.findPage.mockResolvedValue({ items: [department], page: 1, limit: 20, total: 1 });

    const res = await request(app).get('/api/departments?page=1&limit=20');

    expect(res.status).toBe(200);
    expect(res.body.items[0].id).toBe('d');
    expect(deptRepo.findPage).toHaveBeenCalledWith({ page: 1, limit: 20, filters: { siteId: undefined } });
  });

  it('should return 204 when no departments found', async () => {
    deptRepo.findPage.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });

    const res = await request(app).get('/api/departments?page=1&limit=20');

    expect(res.status).toBe(204);
  });

  it('should get department by id', async () => {
    deptRepo.findById.mockResolvedValue(department);

    const res = await request(app).get('/api/departments/d');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('d');
    expect(deptRepo.findById).toHaveBeenCalledWith('d');
  });

  it('should list child departments', async () => {
    deptRepo.findAll.mockResolvedValue([department]);
    const res = await request(app).get('/api/departments/d/children?page=1&limit=20');
    expect(res.status).toBe(204);
    expect(deptRepo.findAll).toHaveBeenCalled();
  });

  it('should get department manager', async () => {
    deptRepo.findById.mockResolvedValue(new Department('d','Dept',null,'u',site));
    userRepo.findById.mockResolvedValue(user);
    const res = await request(app).get('/api/departments/d/manager');
    expect(res.status).toBe(200);
    expect(userRepo.findById).toHaveBeenCalledWith('u');
  });

  it('should get department parent', async () => {
    const child = new Department('d','Dept','p',null,site);
    deptRepo.findById
      .mockResolvedValueOnce(child)
      .mockResolvedValueOnce(department);
    const res = await request(app).get('/api/departments/d/parent');
    expect(res.status).toBe(200);
  });

  it('should return 404 when manager missing', async () => {
    deptRepo.findById.mockResolvedValue(department);
    const res = await request(app).get('/api/departments/d/manager');
    expect(res.status).toBe(404);
  });

  it('should return 404 when parent missing', async () => {
    deptRepo.findById.mockResolvedValue(department);
    const res = await request(app).get('/api/departments/d/parent');
    expect(res.status).toBe(404);
  });

  it('should list department permissions', async () => {
    deptRepo.findById.mockResolvedValue(department);
    const res = await request(app).get('/api/departments/d/permissions?page=1&limit=20');
    expect(res.status).toBe(204);
  });

  it('should list department users', async () => {
    userRepo.findPage.mockResolvedValue({ items: [user], page: 1, limit: 20, total: 1 });
    const res = await request(app).get('/api/departments/d/users?page=1&limit=20');
    expect(res.status).toBe(200);
    expect(userRepo.findPage).toHaveBeenCalledWith({ page: 1, limit: 20, filters: { departmentId: 'd', search: undefined, status: undefined, siteId: undefined, roleId: undefined } });
  });

  it('should create a department', async () => {
    const res = await request(app)
      .post('/api/departments')
      .send({ id: 'd', label: 'Dept', site: { id: 's', label: 'Site' } });

    expect(res.status).toBe(201);
    expect(deptRepo.create).toHaveBeenCalled();
  });

  it('should update a department', async () => {
    const res = await request(app)
      .put('/api/departments/d')
      .send({ label: 'New', site: { id: 's', label: 'Site' } });

    expect(res.status).toBe(200);
    expect(deptRepo.update).toHaveBeenCalled();
  });

  it('should add child department', async () => {
    const res = await request(app).post('/api/departments/d/children/c');

    expect(res.status).toBe(200);
    expect(deptRepo.update).toHaveBeenCalled();
  });

  it('should return 404 when child department missing', async () => {
    deptRepo.findById.mockResolvedValueOnce(null);

    const res = await request(app).post('/api/departments/d/children/c');

    expect(res.status).toBe(404);
  });

  it('should remove child department', async () => {
    const res = await request(app).delete('/api/departments/d/children/c');

    expect(res.status).toBe(200);
    expect(deptRepo.update).toHaveBeenCalled();
  });

  it('should return 404 when removing missing child', async () => {
    deptRepo.findById.mockResolvedValueOnce(null);

    const res = await request(app).delete('/api/departments/d/children/c');

    expect(res.status).toBe(404);
  });

  it('should set manager', async () => {
    const res = await request(app)
      .put('/api/departments/d/manager')
      .send({ userId: 'u' });

    expect(res.status).toBe(200);
    expect(deptRepo.update).toHaveBeenCalled();
  });

  it('should return 404 when department missing for manager', async () => {
    deptRepo.findById.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/departments/d/manager')
      .send({ userId: 'u' });

    expect(res.status).toBe(404);
  });

  it('should remove manager', async () => {
    const res = await request(app).delete('/api/departments/d/manager');

    expect(res.status).toBe(200);
    expect(deptRepo.update).toHaveBeenCalled();
  });

  it('should return 404 when removing manager from missing department', async () => {
    deptRepo.findById.mockResolvedValueOnce(null);

    const res = await request(app).delete('/api/departments/d/manager');

    expect(res.status).toBe(404);
  });

  it('should set parent department', async () => {
    const res = await request(app)
      .put('/api/departments/d/parent')
      .send({ parentId: 'p' });

    expect(res.status).toBe(200);
    expect(deptRepo.update).toHaveBeenCalled();
  });

  it('should return 404 when setting parent for missing department', async () => {
    deptRepo.findById.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/departments/d/parent')
      .send({ parentId: 'p' });

    expect(res.status).toBe(404);
  });

  it('should remove parent department', async () => {
    const res = await request(app).delete('/api/departments/d/parent');

    expect(res.status).toBe(200);
    expect(deptRepo.update).toHaveBeenCalled();
  });

  it('should return 404 when removing parent on missing department', async () => {
    deptRepo.findById.mockResolvedValueOnce(null);

    const res = await request(app).delete('/api/departments/d/parent');

    expect(res.status).toBe(404);
  });

  it('should add permission', async () => {
    const res = await request(app)
      .post('/api/departments/d/permissions')
      .send({ id: 'p', permissionKey: 'P', description: 'desc' });

    expect(res.status).toBe(200);
    expect(deptRepo.update).toHaveBeenCalled();
  });

  it('should return 404 when adding permission to missing department', async () => {
    deptRepo.findById.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/departments/d/permissions')
      .send({ id: 'p', permissionKey: 'P', description: 'desc' });

    expect(res.status).toBe(404);
  });

  it('should remove permission', async () => {
    const res = await request(app).delete('/api/departments/d/permissions/p');

    expect(res.status).toBe(200);
    expect(deptRepo.update).toHaveBeenCalled();
  });

  it('should return 404 when removing permission from missing department', async () => {
    deptRepo.findById.mockResolvedValueOnce(null);

    const res = await request(app).delete('/api/departments/d/permissions/p');

    expect(res.status).toBe(404);
  });

  it('should add user to department', async () => {
    const res = await request(app).post('/api/departments/d/users/u');

    expect(res.status).toBe(200);
    expect(userRepo.update).toHaveBeenCalled();
  });

  it('should return 404 when department missing for user add', async () => {
    deptRepo.findById.mockResolvedValueOnce(null);

    const res = await request(app).post('/api/departments/d/users/u');

    expect(res.status).toBe(404);
  });

  it('should return 404 when user missing for add', async () => {
    userRepo.findById.mockResolvedValueOnce(null);

    const res = await request(app).post('/api/departments/d/users/u');

    expect(res.status).toBe(404);
  });

  it('should remove user from department', async () => {
    const res = await request(app).delete('/api/departments/d/users/u');

    expect(res.status).toBe(200);
    expect(userRepo.update).toHaveBeenCalled();
  });

  it('should return 404 when removing missing user', async () => {
    userRepo.findById.mockResolvedValueOnce(null);

    const res = await request(app).delete('/api/departments/d/users/u');

    expect(res.status).toBe(404);
  });

  it('should delete department', async () => {
    const res = await request(app).delete('/api/departments/d');

    expect(res.status).toBe(204);
    expect(deptRepo.delete).toHaveBeenCalledWith('d');
  });

  it('should return 400 when deletion fails', async () => {
    userRepo.findByDepartmentId.mockResolvedValueOnce([user]);

    const res = await request(app).delete('/api/departments/d');

    expect(res.status).toBe(400);
    expect(deptRepo.delete).not.toHaveBeenCalled();
  });
  it('should list departments with default pagination', async () => {
    deptRepo.findPage.mockResolvedValue({ items: [department], page: 1, limit: 20, total: 1 });
    const res = await request(app).get('/api/departments');
    expect(res.status).toBe(200);
    expect(deptRepo.findPage).toHaveBeenCalledWith({ page: 1, limit: 20, filters: { siteId: undefined } });
  });

  it('should return 404 when department not found by id', async () => {
    deptRepo.findById.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/departments/unknown');
    expect(res.status).toBe(404);
  });

});
