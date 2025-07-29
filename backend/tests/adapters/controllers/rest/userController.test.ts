import request from 'supertest';
import express from 'express';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createUserRouter } from '../../../../adapters/controllers/rest/userController';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { AvatarServicePort } from '../../../../domain/ports/AvatarServicePort';
import { TokenServicePort } from '../../../../domain/ports/TokenServicePort';
import { RefreshTokenPort } from '../../../../domain/ports/RefreshTokenPort';

import { User } from '../../../../domain/entities/User';
import { Role } from '../../../../domain/entities/Role';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';
import { Permission } from '../../../../domain/entities/Permission';
import { PermissionKeys } from '../../../../domain/entities/PermissionKeys';
import { AccountLockedError } from '../../../../domain/errors/AccountLockedError';
import { TokenExpiredException } from '../../../../domain/errors/TokenExpiredException';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { RefreshToken } from '../../../../domain/entities/RefreshToken';
import { AuditPort } from '../../../../domain/ports/AuditPort';
import { GetConfigUseCase } from '../../../../usecases/config/GetConfigUseCase';
import { AppConfigKeys } from '../../../../domain/entities/AppConfigKeys';
import { PasswordValidator } from '../../../../domain/services/PasswordValidator';

describe('User REST controller', () => {
  let app: express.Express;
  let auth: DeepMockProxy<AuthServicePort>;
  let repo: DeepMockProxy<UserRepositoryPort>;
  let avatar: DeepMockProxy<AvatarServicePort>;
  let tokenService: DeepMockProxy<TokenServicePort>;
  let refreshRepo: DeepMockProxy<RefreshTokenPort>;
  let audit: DeepMockProxy<AuditPort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let getConfig: DeepMockProxy<GetConfigUseCase>;
  let passwordValidator: DeepMockProxy<PasswordValidator>;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    auth = mockDeep<AuthServicePort>();
    repo = mockDeep<UserRepositoryPort>();
    avatar = mockDeep<AvatarServicePort>();
    tokenService = mockDeep<TokenServicePort>();
    refreshRepo = mockDeep<RefreshTokenPort>();
    audit = mockDeep<AuditPort>();
    logger = mockDeep<LoggerPort>();
    getConfig = mockDeep<GetConfigUseCase>();
    passwordValidator = mockDeep<PasswordValidator>();
    passwordValidator.validate.mockResolvedValue();
    (getConfig.execute as jest.Mock).mockImplementation(async (key: string) => {
      switch (key) {
      case AppConfigKeys.ACCOUNT_LOCK_ON_LOGIN_FAIL:
        return false;
      case AppConfigKeys.ACCOUNT_LOCK_DURATION:
        return 900;
      case AppConfigKeys.ACCOUNT_LOCK_FAIL_THRESHOLD:
        return 4;
      default:
        return null;
      }
    });
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
    app.use(
      '/api',
      createUserRouter(
        auth,
        repo,
        audit,
        avatar,
        tokenService,
        refreshRepo,
        logger,
        getConfig,
        passwordValidator,
      ),
    );
  });

  function serializePermission(p: Permission) {
    return {
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      createdBy: null,
      updatedBy: null,
    };
  }

  function serializeRole(r: Role) {
    return {
      ...r,
      permissions: r.permissions.map(serializePermission),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      createdBy: null,
      updatedBy: null,
    };
  }

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
      roles: [serializeRole(role)],
      status: 'active',
      department: {
        ...department,
        site: {
          ...site,
          createdAt: site.createdAt.toISOString(),
          updatedAt: site.updatedAt.toISOString(),
          createdBy: null,
          updatedBy: null,
        },
        createdAt: department.createdAt.toISOString(),
        updatedAt: department.updatedAt.toISOString(),
        createdBy: null,
        updatedBy: null,
      },
      site: {
        ...site,
        createdAt: site.createdAt.toISOString(),
        updatedAt: site.updatedAt.toISOString(),
        createdBy: null,
        updatedBy: null,
      },
      lastLogin: null,
      lastActivity: null,
      failedLoginAttempts: 0,
      lastFailedLoginAt: null,
      lockedUntil: null,
      passwordChangedAt: user.passwordChangedAt.toISOString(),
      permissions: [],
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      createdBy: null,
      updatedBy: null,
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

  it('should return token expired error when JWT expired', async () => {
    auth.verifyToken.mockRejectedValue(new TokenExpiredException());

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer old');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
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
    tokenService.generateAccessToken.mockReturnValue('t');
    tokenService.generateRefreshToken.mockResolvedValue('r');
    const res = await request(app)
      .post('/api/users')
      .send({ id: 'u', firstName: 'John', lastName: 'Doe', email: 'john@example.com', roles: [{ id: 'r', label: 'Role' }], status: 'active', permissions: [{ id: 'p', permissionKey: 'k', description: 'd' }], department: { id: 'd', label: 'Dept', site: { id: 's', label: 'Site' } }, site: { id: 's', label: 'Site' }, password: 'Password1!' });

    expect(res.status).toBe(201);
    const expectedUser = {
      ...user,
      roles: [serializeRole(role)],
      department: {
        ...department,
        site: {
          ...site,
          createdAt: site.createdAt.toISOString(),
          updatedAt: site.updatedAt.toISOString(),
          createdBy: null,
          updatedBy: null,
        },
        createdAt: department.createdAt.toISOString(),
        updatedAt: department.updatedAt.toISOString(),
        createdBy: null,
        updatedBy: null,
      },
      site: {
        ...site,
        createdAt: site.createdAt.toISOString(),
        updatedAt: site.updatedAt.toISOString(),
        createdBy: null,
        updatedBy: null,
      },
      lastLogin: null,
      lastActivity: null,
      passwordChangedAt: user.passwordChangedAt.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      createdBy: null,
      updatedBy: null,
    };
    expect(res.body).toEqual({
      user: expectedUser,
      token: 't',
      refreshToken: 'r',
    });
    expect(passwordValidator.validate).toHaveBeenCalledWith('Password1!');
    expect(repo.create).toHaveBeenCalled();
  });

  it('should authenticate a user', async () => {
    tokenService.generateAccessToken.mockReturnValue('t');
    tokenService.generateRefreshToken.mockResolvedValue('r');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'secret123' });

    expect(res.status).toBe(200);
    const expected = {
      ...user,
      roles: [serializeRole(role)],
      department: {
        ...department,
        site: {
          ...site,
          createdAt: site.createdAt.toISOString(),
          updatedAt: site.updatedAt.toISOString(),
          createdBy: null,
          updatedBy: null,
        },
        createdAt: department.createdAt.toISOString(),
        updatedAt: department.updatedAt.toISOString(),
        createdBy: null,
        updatedBy: null,
      },
      site: {
        ...site,
        createdAt: site.createdAt.toISOString(),
        updatedAt: site.updatedAt.toISOString(),
        createdBy: null,
        updatedBy: null,
      },
      lastLogin: user.lastLogin!.toISOString(),
      lastActivity: user.lastActivity!.toISOString(),
      failedLoginAttempts: 0,
      lastFailedLoginAt: null,
      lockedUntil: null,
      passwordChangedAt: user.passwordChangedAt.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      createdBy: null,
      updatedBy: null,
    };
    expect(res.body).toEqual({
      user: expected,
      token: 't',
      refreshToken: 'r',
      passwordWillExpireSoon: false,
    });
    expect(auth.authenticate).toHaveBeenCalled();
  });

  it('should return 401 when authentication fails', async () => {
    auth.authenticate.mockRejectedValue(new Error('bad'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'badpass1' });

    expect(res.status).toBe(401);
  });

  it('should return 423 when account is locked', async () => {
    user.lockedUntil = new Date(Date.now() + 1000);
    repo.findByEmail.mockResolvedValue(user);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'secret123' });

    expect(res.status).toBe(423);
    expect(res.body).toEqual({
      error:
        'Account is temporarily locked due to multiple failed login attempts.',
      code: 'account_locked',
      lockedUntil: user.lockedUntil.toISOString(),
    });
    expect(auth.authenticate).not.toHaveBeenCalled();
  });

  it('should return 403 when user account is suspended', async () => {
    auth.authenticate.mockRejectedValue(
      new Error('User account is suspended or archived'),
    );

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'secret123' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('User account is suspended or archived');
  });

  it('should return 400 when parameters are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing required parameters: email, password');
  });

  it('should return 422 when parameters are invalid', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bad', password: 'short' });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('Invalid parameters value : email, password');
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
    expect(passwordValidator.validate).toHaveBeenCalledWith('new');
    expect(auth.verifyToken).toHaveBeenCalledWith('tok');
    expect(auth.resetPassword).toHaveBeenCalledWith('tok', 'new');
    expect(refreshRepo.revokeAll).toHaveBeenCalledWith('u');
  });

  it('should refresh tokens', async () => {
    refreshRepo.findValidByToken.mockResolvedValue(
      new RefreshToken('1', 'u', 'oldh', new Date(Date.now() + 1000)),
    );
    tokenService.generateAccessToken.mockReturnValue('newT');
    tokenService.generateRefreshToken.mockResolvedValue('newR');

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'old' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe('newT');
    expect(res.body.refreshToken).toBeDefined();
    expect(refreshRepo.findValidByToken).toHaveBeenCalledWith('old');
    expect(refreshRepo.markAsUsed).toHaveBeenCalled();
  });

  it('should logout and revoke all refresh tokens', async () => {
    refreshRepo.findValidByToken.mockResolvedValue(
      new RefreshToken('1', 'u', 'oldh', new Date(Date.now() + 1000)),
    );

    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: 'old' });

    expect(res.status).toBe(200);
    expect(refreshRepo.findValidByToken).toHaveBeenCalledWith('old');
    expect(refreshRepo.revokeAll).toHaveBeenCalledWith('u');
  });

  it('should return 401 for invalid logout token', async () => {
    refreshRepo.findValidByToken.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: 'bad' });

    expect(res.status).toBe(401);
  });

  it('should return 401 for invalid refresh token', async () => {
    refreshRepo.findValidByToken.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'bad' });

    expect(res.status).toBe(401);
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
