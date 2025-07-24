import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaUserGroupRepository } from '../../../adapters/repositories/PrismaUserGroupRepository';
import { UserGroup } from '../../../domain/entities/UserGroup';
import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/entities/Role';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { LoggerPort } from '../../../domain/ports/LoggerPort';

describe('PrismaUserGroupRepository', () => {
  let repo: PrismaUserGroupRepository;
  let prisma: DeepMockProxy<PrismaClient>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let group: UserGroup;
  let user: User;
  let role: Role;
  let site: Site;
  let dept: Department;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    logger = mockDeep<LoggerPort>();
    repo = new PrismaUserGroupRepository(prisma, logger);
    role = new Role('r', 'Role');
    site = new Site('s', 'Site');
    dept = new Department('d', 'Dept', null, null, site);
    user = new User('u', 'John', 'Doe', 'john@example.com', [role], 'active', dept, site);
    group = new UserGroup('g', 'Group', user, [user]);
  });

  it('should create a group', async () => {
    (prisma as any).userGroup.create.mockResolvedValue({
      id: 'g',
      name: 'Group',
      description: null,
      responsibleUserId: 'u',
      responsibleUser: {
        id: 'u',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        roles: [],
        status: 'active',
        department: { id: 'd', label: 'Dept', parentDepartmentId: null, managerUserId: null, siteId: 's', site: { id: 's', label: 'Site' } },
        site: { id: 's', label: 'Site' },
        permissions: [],
      },
      members: [] as any,
    } as any);

    await repo.create(group);
    expect((prisma as any).userGroup.create).toHaveBeenCalled();
  });

  it('should return all groups', async () => {
    (prisma as any).userGroup.findMany.mockResolvedValue([] as any);
    await repo.findAll();
    expect((prisma as any).userGroup.findMany).toHaveBeenCalled();
  });
});
