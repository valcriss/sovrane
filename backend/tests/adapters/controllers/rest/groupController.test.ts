import request from 'supertest';
import express from 'express';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { createGroupRouter } from '../../../../adapters/controllers/rest/groupController';
import { UserGroupRepositoryPort } from '../../../../domain/ports/UserGroupRepositoryPort';
import { UserRepositoryPort } from '../../../../domain/ports/UserRepositoryPort';
import { LoggerPort } from '../../../../domain/ports/LoggerPort';
import { UserGroup } from '../../../../domain/entities/UserGroup';
import { User } from '../../../../domain/entities/User';
import { Role } from '../../../../domain/entities/Role';
import { Department } from '../../../../domain/entities/Department';
import { Site } from '../../../../domain/entities/Site';

describe('Group REST controller', () => {
  let app: express.Express;
  let groupRepo: DeepMockProxy<UserGroupRepositoryPort>;
  let userRepo: DeepMockProxy<UserRepositoryPort>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let site: Site;
  let dept: Department;
  let role: Role;
  let user: User;
  let group: UserGroup;

  beforeEach(() => {
    groupRepo = mockDeep<UserGroupRepositoryPort>();
    userRepo = mockDeep<UserRepositoryPort>();
    logger = mockDeep<LoggerPort>();
    site = new Site('s', 'Site');
    dept = new Department('d', 'Dept', null, null, site);
    role = new Role('r', 'Role');
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
    group = new UserGroup('g', 'Group', user, [user]);
    groupRepo.create.mockResolvedValue(group);
    groupRepo.findAll.mockResolvedValue([group]);
    groupRepo.findById.mockResolvedValue(group);
    userRepo.findById.mockResolvedValue(user);

    app = express();
    app.use(express.json());
    app.use('/api', createGroupRouter(groupRepo, userRepo, logger));
  });

  it('should create a group', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', 'Bearer u')
      .send({ id: 'g', name: 'Group' });
    expect(res.status).toBe(201);
    expect(groupRepo.create).toHaveBeenCalled();
  });

  it('should list groups', async () => {
    const res = await request(app)
      .get('/api/groups')
      .set('Authorization', 'Bearer u');
    expect(res.status).toBe(200);
    expect(groupRepo.findAll).toHaveBeenCalled();
  });

  it('should forbid update when not responsible', async () => {
    const other = new User('x', 'Jane', 'Doe', 'jane@example.com', [role], 'active', dept, site);
    userRepo.findById.mockResolvedValueOnce(other);
    const res = await request(app)
      .patch('/api/groups/g')
      .set('Authorization', 'Bearer x')
      .send({ name: 'New' });
    expect(res.status).toBe(403);
  });
});
