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
});
