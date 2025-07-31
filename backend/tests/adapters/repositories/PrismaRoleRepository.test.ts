import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaRoleRepository } from '../../../adapters/repositories/PrismaRoleRepository';
import { Role } from '../../../domain/entities/Role';
import { Permission } from '../../../domain/entities/Permission';
import { RolePermissionAssignment } from '../../../domain/entities/RolePermissionAssignment';
import { LoggerPort } from '../../../domain/ports/LoggerPort';

describe('PrismaRoleRepository', () => {
  let repository: PrismaRoleRepository;
  let prisma: DeepMockProxy<PrismaClient>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let role: Role;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    logger = mockDeep<LoggerPort>();
    repository = new PrismaRoleRepository(prisma, logger);
    role = new Role('role-1', 'Admin', [new RolePermissionAssignment(new Permission('perm', 'P', 'desc'))]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a role when found', async () => {
      prisma.role.findUnique.mockResolvedValue({
        id: 'role-1',
        label: 'Admin',
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        permissions: [
          { roleId: 'role-1', permissionId: 'perm', scopeId: 's1', permission: { id: 'perm', permissionKey: 'P', description: 'desc' } },
        ],
      } as any);

      const result = await repository.findById('role-1');

      expect(result).toEqual(role);
      expect(prisma.role.findUnique).toHaveBeenCalledWith({ where: { id: 'role-1' }, include: { permissions: { include: { permission: true } } } });
    });

    it('should return null when not found', async () => {
      prisma.role.findUnique.mockResolvedValue(null);

      const result = await repository.findById('unknown');

      expect(result).toBeNull();
      expect(prisma.role.findUnique).toHaveBeenCalledWith({ where: { id: 'unknown' }, include: { permissions: { include: { permission: true } } } });
    });
  });

  describe('findByLabel', () => {
    it('should return a role by label', async () => {
      prisma.role.findFirst.mockResolvedValue({
        id: 'role-1',
        label: 'Admin',
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      } as any);

      const result = await repository.findByLabel('Admin');

      expect(result).toEqual(role);
      expect(prisma.role.findFirst).toHaveBeenCalledWith({ where: { label: 'Admin' } });
    });

    it('should return null when role not found', async () => {
      prisma.role.findFirst.mockResolvedValue(null);

      const result = await repository.findByLabel('Unknown');

      expect(result).toBeNull();
      expect(prisma.role.findFirst).toHaveBeenCalledWith({ where: { label: 'Unknown' } });
    });
  });

  describe('create', () => {
    it('should create a role', async () => {
      prisma.role.create.mockResolvedValue({
        id: 'role-1',
        label: 'Admin',
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        permissions: [],
      } as any);

      const result = await repository.create(role);

      expect(result).toEqual(role);
      expect(prisma.role.create).toHaveBeenCalledWith({
        data: {
          id: 'role-1',
          label: 'Admin',
          createdById: undefined,
          updatedById: undefined,
          permissions: { create: [ { scopeId: undefined, permission: { connect: { id: 'perm' } } } ] },
        },
        include: { permissions: { include: { permission: true } } },
      });
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      prisma.role.update.mockResolvedValue({
        id: 'role-1',
        label: 'Super Admin',
        createdAt: role.createdAt,
        updatedAt: new Date('2024-01-01'),
        permissions: [],
      } as any);

      role.label = 'Super Admin';
      const result = await repository.update(role);

      expect(result).toEqual(
        new Role(
          'role-1',
          'Super Admin',
          [],
          role.createdAt,
          new Date('2024-01-01'),
          null,
          null,
        ),
      );
      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        data: { label: 'Super Admin', updatedById: undefined, permissions: { deleteMany: {}, create: [ { scopeId: undefined, permission: { connect: { id: 'perm' } } } ] } },
        include: { permissions: { include: { permission: true } } },
      });
    });
  });

  describe('delete', () => {
    it('should delete a role', async () => {
      prisma.role.delete.mockResolvedValue(undefined as any);

      await repository.delete('role-1');

      expect(prisma.role.delete).toHaveBeenCalledWith({ where: { id: 'role-1' } });
    });
  });

  it('should paginate roles', async () => {
    prisma.role.findMany.mockResolvedValue([] as any);
    prisma.role.count.mockResolvedValue(0 as any);
    const result = await repository.findPage({ page: 1, limit: 5 });
    expect(result).toEqual({ items: [], page: 1, limit: 5, total: 0 });
    expect(prisma.role.findMany).toHaveBeenCalled();
    expect(prisma.role.count).toHaveBeenCalled();
  });

  it('should return all roles', async () => {
    prisma.role.findMany.mockResolvedValue([
      {
        id: 'role-1',
        label: 'Admin',
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        permissions: [],
      } as any,
    ]);
    const result = await repository.findAll();
    expect(result).toEqual([role]);
    expect(prisma.role.findMany).toHaveBeenCalledWith({ include: { permissions: { include: { permission: true } } } });
  });
});
