import request from 'supertest';
import express from 'express';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createPermissionRouter } from '../../../../adapters/controllers/rest/permissionController';
import { PermissionRepositoryPort } from '../../../../domain/ports/PermissionRepositoryPort';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { Permission } from '../../../../domain/entities/Permission';

describe('Permission REST controller', () => {
  let app: express.Express;
  let repo: DeepMockProxy<PermissionRepositoryPort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let permission: Permission;

  beforeEach(() => {
    repo = mockDeep<PermissionRepositoryPort>();
    logger = mockDeep<LoggerPort>();
    permission = new Permission('p', 'KEY', 'desc');
    repo.create.mockResolvedValue(permission);
    repo.update.mockResolvedValue(permission);

    app = express();
    app.use(express.json());
    app.use('/api', createPermissionRouter(repo, logger));
  });

  it('should list permissions', async () => {
    repo.findPage.mockResolvedValue({ items: [permission], page: 1, limit: 20, total: 1 });

    const res = await request(app).get('/api/permissions?page=1&limit=20');

    expect(res.status).toBe(200);
    expect(res.body.items[0].id).toBe('p');
    expect(repo.findPage).toHaveBeenCalledWith({ page: 1, limit: 20, filters: { search: undefined } });
  });

  it('should get permission by id', async () => {
    repo.findById.mockResolvedValue(permission);

    const res = await request(app).get('/api/permissions/p');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('p');
    expect(repo.findById).toHaveBeenCalledWith('p');
  });

  it('should create a permission', async () => {
    const res = await request(app)
      .post('/api/permissions')
      .send({ id: 'p', permissionKey: 'KEY', description: 'desc' });

    expect(res.status).toBe(201);
    expect(repo.create).toHaveBeenCalled();
  });

  it('should update a permission', async () => {
    const res = await request(app)
      .put('/api/permissions/p')
      .send({ permissionKey: 'NEW', description: 'desc' });

    expect(res.status).toBe(200);
    expect(repo.update).toHaveBeenCalled();
  });

  it('should delete a permission', async () => {
    const res = await request(app).delete('/api/permissions/p');

    expect(res.status).toBe(204);
    expect(repo.delete).toHaveBeenCalledWith('p');
  });
  it('should list permissions with default pagination', async () => {
    repo.findPage.mockResolvedValue({ items: [permission], page: 1, limit: 20, total: 1 });
    const res = await request(app).get('/api/permissions');
    expect(res.status).toBe(200);
    expect(repo.findPage).toHaveBeenCalledWith({ page: 1, limit: 20, filters: { search: undefined } });
  });

  it('should return 404 when permission not found', async () => {
    repo.findById.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/permissions/unknown');
    expect(res.status).toBe(404);
  });

});
