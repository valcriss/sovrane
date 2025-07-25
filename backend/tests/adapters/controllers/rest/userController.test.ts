import request from 'supertest';
import express from 'express';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createUserRouter } from '../../../../adapters/controllers/rest/userController';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { AvatarServicePort } from '../../../../domain/ports/AvatarServicePort';

import { User } from '../../../../domain/entities/User';
import { Role } from '../../../../domain/entities/Role';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';
import { Permission } from '../../../../domain/entities/Permission';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';

describe('User REST controller', () => {
  let app: express.Express;
  let auth: DeepMockProxy<AuthServicePort>;
  let repo: DeepMockProxy<UserRepositoryPort>;
  let avatar: DeepMockProxy<AvatarServicePort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    auth = mockDeep<AuthServicePort>();
    repo = mockDeep<UserRepositoryPort>();
    avatar = mockDeep<AvatarServicePort>();
    logger = mockDeep<LoggerPort>();
    role = new Role('r', 'Role', [new Permission('p', PermissionKeys.ROOT, 'root')]);
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    repo.findById.mockResolvedValue(user);
    auth.verifyToken.mockResolvedValue(user);
    repo.create.mockResolvedValue(user);
    repo.update.mockResolvedValue(user);
    repo.delete.mockResolvedValue();
    auth.authenticate.mockResolvedValue(user);
    auth.authenticateWithProvider.mockResolvedValue(user);
    auth.requestPasswordReset.mockResolvedValue();
    auth.resetPassword.mockResolvedValue();
    app = express();
    app.use(express.json());
    app.use('/api', createUserRouter(auth, repo, avatar, logger));
  });

  it('should return current user profile', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 'u',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      roles: [role],
      status: 'active',
      department,
      site,
      permissions: [],
    });
    expect(auth.verifyToken).toHaveBeenCalledWith('token');
  });

  it('should reject unauthorized requests', async () => {
    auth.verifyToken.mockRejectedValue(new Error('bad'));

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer bad');

    expect(res.status).toBe(401);
  });

  it('should reject requests without header', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('should return 404 when user not found', async () => {
    repo.findById.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(404);
  });

  it('should register a user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ id: 'u', firstName: 'John', lastName: 'Doe', email: 'john@example.com', roles: [{ id: 'r', label: 'Role' }], status: 'active', permissions: [{ id: 'p', permissionKey: 'k', description: 'd' }], department: { id: 'd', label: 'Dept', site: { id: 's', label: 'Site' } }, site: { id: 's', label: 'Site' } });

    expect(res.status).toBe(201);
    expect(repo.create).toHaveBeenCalled();
  });

  it('should authenticate a user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'secret' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 'u',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      roles: [role],
      status: 'active',
      department,
      site,
      permissions: [],
    });
    expect(auth.authenticate).toHaveBeenCalled();
  });

  it('should return 401 when authentication fails', async () => {
    auth.authenticate.mockRejectedValue(new Error('bad'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'bad' });

    expect(res.status).toBe(401);
  });

  it('should return 403 when user account is suspended', async () => {
    auth.authenticate.mockRejectedValue(
      new Error('User account is suspended or archived'),
    );

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'secret' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('User account is suspended or archived');
  });

  it('should authenticate with provider', async () => {
    const res = await request(app)
      .post('/api/auth/provider')
      .send({ provider: 'oidc', token: 't' });

    expect(res.status).toBe(200);
    expect(auth.authenticateWithProvider).toHaveBeenCalled();
  });

  it('should return 401 when provider authentication fails', async () => {
    auth.authenticateWithProvider.mockRejectedValue(new Error('bad'));

    const res = await request(app)
      .post('/api/auth/provider')
      .send({ provider: 'oidc', token: 'bad' });

    expect(res.status).toBe(401);
  });

  it('should return 403 when provider account is suspended', async () => {
    auth.authenticateWithProvider.mockRejectedValue(
      new Error('User account is suspended or archived'),
    );

    const res = await request(app)
      .post('/api/auth/provider')
      .send({ provider: 'oidc', token: 'bad' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('User account is suspended or archived');
  });

  it('should request password reset', async () => {
    const res = await request(app)
      .post('/api/auth/request-reset')
      .send({ email: 'john@example.com' });

    expect(res.status).toBe(204);
    expect(auth.requestPasswordReset).toHaveBeenCalledWith('john@example.com');
  });

  it('should reset password', async () => {
    const res = await request(app)
      .post('/api/auth/reset')
      .send({ token: 'tok', password: 'new' });

    expect(res.status).toBe(204);
    expect(auth.resetPassword).toHaveBeenCalledWith('tok', 'new');
  });

  it('should list users', async () => {
    repo.findPage.mockResolvedValue({ items: [user], page: 1, limit: 20, total: 1 });

    const res = await request(app)
      .get('/api/users?page=1&limit=20')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.items[0].id).toBe('u');
    expect(repo.findPage).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      filters: {
        search: undefined,
        status: undefined,
        departmentId: undefined,
        siteId: undefined,
        roleId: undefined,
      },
    });
  });

  it('should return 204 when no users found', async () => {
    repo.findPage.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });

    const res = await request(app)
      .get('/api/users?page=1&limit=20')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(204);
  });

  it('should return 403 when permission missing', async () => {
    // user has no permissions assigned
    auth.verifyToken.mockResolvedValue(
      new User('u', 'John', 'Doe', 'john@example.com', [], 'active', department, site),
    );

    const res = await request(app)
      .get('/api/users?page=1&limit=20')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(403);
  });

  it('should return 403 for get user when permission missing', async () => {
    auth.verifyToken.mockResolvedValue(
      new User('u', 'John', 'Doe', 'john@example.com', [], 'active', department, site),
    );

    const res = await request(app)
      .get('/api/users/u')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(403);
  });

  it('should get user by id', async () => {
    repo.findById.mockResolvedValue(user);

    const res = await request(app)
      .get('/api/users/u')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('u');
    expect(repo.findById).toHaveBeenCalledWith('u');
  });

  it('should update user profile', async () => {
    const res = await request(app)
      .put('/api/users/u')
      .set('Authorization', 'Bearer token')
      .send({ firstName: 'Jane', lastName: 'Doe', email: 'john@example.com', roles: [{ id: 'r', label: 'Role' }], status: 'active', permissions: [{ id: 'p', permissionKey: 'k', description: 'd' }], department: { id: 'd', label: 'Dept', site: { id: 's', label: 'Site' } }, site: { id: 's', label: 'Site' } });

    expect(res.status).toBe(200);
    expect(repo.update).toHaveBeenCalled();
  });

  it('should change user status', async () => {
    const res = await request(app)
      .put('/api/users/u/status')
      .set('Authorization', 'Bearer token')
      .send({ status: 'suspended' });

    expect(res.status).toBe(200);
    expect(repo.update).toHaveBeenCalled();
  });

  it('should return 404 when status change user not found', async () => {
    repo.findById.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/users/u/status')
      .set('Authorization', 'Bearer token')
      .send({ status: 'suspended' });

    expect(res.status).toBe(404);
  });

  it('should remove user', async () => {
    const res = await request(app)
      .delete('/api/users/u')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(204);
    expect(repo.delete).toHaveBeenCalledWith('u');
  });

  it('should upload user avatar', async () => {
    const res = await request(app)
      .post('/api/users/u/picture')
      .set('Authorization', 'Bearer token')
      .attach('file', Buffer.from('img'), 'avatar.png');

    expect(res.status).toBe(204);
    expect(avatar.setUserAvatar).toHaveBeenCalled();
  });

  it('should delete user avatar', async () => {
    const res = await request(app)
      .delete('/api/users/u/picture')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(204);
    expect(avatar.removeUserAvatar).toHaveBeenCalledWith('u');
  });
  it('should list users with default pagination', async () => {
    repo.findPage.mockResolvedValue({ items: [user], page: 1, limit: 20, total: 1 });
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(repo.findPage).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      filters: {
        search: undefined,
        status: undefined,
        departmentId: undefined,
        siteId: undefined,
        roleId: undefined,
      },
    });
  });

  it('should return 404 when user not found by id', async () => {
    repo.findById.mockResolvedValueOnce(null);
    const res = await request(app)
      .get('/api/users/unknown')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(404);
  });

});
