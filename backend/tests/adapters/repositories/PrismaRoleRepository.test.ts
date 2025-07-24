import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaRoleRepository } from '../../../adapters/repositories/PrismaRoleRepository';
import { Role } from '../../../domain/entities/Role';
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
    role = new Role('role-1', 'Admin');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a role when found', async () => {
      prisma.role.findUnique.mockResolvedValue({ id: 'role-1', label: 'Admin' } as any);

      const result = await repository.findById('role-1');

      expect(result).toEqual(role);
      expect(prisma.role.findUnique).toHaveBeenCalledWith({ where: { id: 'role-1' } });
    });

    it('should return null when not found', async () => {
      prisma.role.findUnique.mockResolvedValue(null);

      const result = await repository.findById('unknown');

      expect(result).toBeNull();
      expect(prisma.role.findUnique).toHaveBeenCalledWith({ where: { id: 'unknown' } });
    });
  });

  describe('findByLabel', () => {
    it('should return a role by label', async () => {
      prisma.role.findFirst.mockResolvedValue({ id: 'role-1', label: 'Admin' } as any);

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
      prisma.role.create.mockResolvedValue({ id: 'role-1', label: 'Admin' } as any);

      const result = await repository.create(role);

      expect(result).toEqual(role);
      expect(prisma.role.create).toHaveBeenCalledWith({ data: { id: 'role-1', label: 'Admin' } });
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      prisma.role.update.mockResolvedValue({ id: 'role-1', label: 'Super Admin' } as any);

      role.label = 'Super Admin';
      const result = await repository.update(role);

      expect(result).toEqual(new Role('role-1', 'Super Admin'));
      expect(prisma.role.update).toHaveBeenCalledWith({ where: { id: 'role-1' }, data: { label: 'Super Admin' } });
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
      { id: 'role-1', label: 'Admin', permissions: [] } as any,
    ]);
    const result = await repository.findAll();
    expect(result).toEqual([role]);
    expect(prisma.role.findMany).toHaveBeenCalledWith();
  });
});
