import request from 'supertest';
import express from 'express';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createUserRouter } from '../../../../adapters/controllers/rest/userController';
import { AuthServicePort } from '../../../../domain/ports/AuthServicePort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { User } from '../../../../domain/entities/User';
import { Role } from '../../../../domain/entities/Role';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';

describe('User REST controller', () => {
  let app: express.Express;
  let auth: DeepMockProxy<AuthServicePort>;
  let repo: DeepMockProxy<UserRepositoryPort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let user: User;
  let role: Role;
  let department: Department;
  let site: Site;

  beforeEach(() => {
    auth = mockDeep<AuthServicePort>();
    repo = mockDeep<UserRepositoryPort>();
    logger = mockDeep<LoggerPort>();
    role = new Role('r', 'Role');
    site = new Site('s', 'Site');
    department = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', department, site);
    repo.findById.mockResolvedValue(user);
    auth.verifyToken.mockResolvedValue(user);
    app = express();
    app.use('/api', createUserRouter(auth, repo, logger));
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
});
