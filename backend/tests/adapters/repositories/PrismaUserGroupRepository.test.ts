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
        roles: [{ role: { id: 'r', label: 'Role' } }],
        status: 'active',
        department: { id: 'd', label: 'Dept', parentDepartmentId: null, managerUserId: null, siteId: 's', site: { id: 's', label: 'Site' } },
        site: { id: 's', label: 'Site' },
        permissions: [{ permission: { id: 'p', permissionKey: 'KEY', description: 'desc' } }],
      },
      members: [] as any,
    } as any);

    await repo.create(group);
    expect((prisma as any).userGroup.create).toHaveBeenCalled();
  });

  it('should return all groups', async () => {
    (prisma as any).userGroup.findMany.mockResolvedValue([
      {
        id: 'g',
        name: 'Group',
        description: null,
        responsibleUser: {
          id: 'u',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
          roles: [{ role: { id: 'r', label: 'Role' } }],
          status: 'active',
          department: { id: 'd', label: 'Dept', parentDepartmentId: null, managerUserId: null, site: { id: 's', label: 'Site' } },
          site: { id: 's', label: 'Site' },
          permissions: [{ permission: { id: 'p', permissionKey: 'KEY', description: 'desc' } }],
        },
        members: [] as any,
      },
    ] as any);
    await repo.findAll();
    expect((prisma as any).userGroup.findMany).toHaveBeenCalled();
  });

  it('should find group by id', async () => {
    (prisma as any).userGroup.findUnique.mockResolvedValue({
      id: 'g',
      name: 'Group',
      description: null,
      responsibleUser: {
        id: 'u',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        roles: [{ role: { id: 'r', label: 'Role' } }],
        status: 'active',
        department: { id: 'd', label: 'Dept', parentDepartmentId: null, managerUserId: null, site: { id: 's', label: 'Site' } },
        site: { id: 's', label: 'Site' },
        permissions: [{ permission: { id: 'p', permissionKey: 'KEY', description: 'desc' } }],
      },
      members: [{ user: { id: 'u', firstname: 'John', lastname: 'Doe', email: 'john@example.com', roles: [{ role: { id: 'r', label: 'Role' } }], status: 'active', department: { id: 'd', label: 'Dept', parentDepartmentId: null, managerUserId: null, site: { id: 's', label: 'Site' } }, site: { id: 's', label: 'Site' }, permissions: [{ permission: { id: 'p', permissionKey: 'KEY', description: 'desc' } }] } }],
    } as any);

    const result = await repo.findById('g');

    expect(result?.id).toBe('g');
    expect((prisma as any).userGroup.findUnique).toHaveBeenCalled();
  });

  it('should return null when group not found', async () => {
    (prisma as any).userGroup.findUnique.mockResolvedValue(null);

    const result = await repo.findById('missing');

    expect(result).toBeNull();
  });

  it('should update a group', async () => {
    (prisma as any).userGroup.update.mockResolvedValue({
      id: 'g',
      name: 'New',
      description: null,
      responsibleUser: {
        id: 'u',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        roles: [{ role: { id: 'r', label: 'Role' } }],
        status: 'active',
        department: { id: 'd', label: 'Dept', parentDepartmentId: null, managerUserId: null, site: { id: 's', label: 'Site' } },
        site: { id: 's', label: 'Site' },
        permissions: [{ permission: { id: 'p', permissionKey: 'KEY', description: 'desc' } }],
      },
      members: [] as any,
    } as any);

    await repo.update(group);

    expect((prisma as any).userGroup.update).toHaveBeenCalled();
  });

  it('should delete a group', async () => {
    (prisma as any).userGroup.delete.mockResolvedValue(undefined as any);

    await repo.delete('g');

    expect((prisma as any).userGroup.delete).toHaveBeenCalledWith({ where: { id: 'g' } });
  });

  it('should add user to group', async () => {
    (prisma as any).userGroupMember.create.mockResolvedValue({});
    jest.spyOn(repo, 'findById').mockResolvedValue(group);

    const result = await repo.addUser('g', 'u');

    expect(result).toBe(group);
    expect((prisma as any).userGroupMember.create).toHaveBeenCalledWith({ data: { groupId: 'g', userId: 'u' } });
  });

  it('should remove user from group', async () => {
    (prisma as any).userGroupMember.delete.mockResolvedValue({});
    jest.spyOn(repo, 'findById').mockResolvedValue(group);

    const result = await repo.removeUser('g', 'u');

    expect(result).toBe(group);
    expect((prisma as any).userGroupMember.delete).toHaveBeenCalledWith({ where: { userId_groupId: { userId: 'u', groupId: 'g' } } });
  });

  it('should paginate groups', async () => {
    (prisma as any).userGroup.findMany.mockResolvedValue([]);
    (prisma as any).userGroup.count.mockResolvedValue(0);
    const result = await repo.findPage({ page: 1, limit: 5 });
    expect(result).toEqual({ items: [], page: 1, limit: 5, total: 0 });
    expect((prisma as any).userGroup.findMany).toHaveBeenCalled();
    expect((prisma as any).userGroup.count).toHaveBeenCalled();
  });
});
