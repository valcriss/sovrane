import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaPermissionRepository } from '../../../adapters/repositories/PrismaPermissionRepository';
import { Permission } from '../../../domain/entities/Permission';
import { LoggerPort } from '../../../domain/ports/LoggerPort';

describe('PrismaPermissionRepository', () => {
  let repository: PrismaPermissionRepository;
  let prisma: DeepMockProxy<PrismaClient>;
  let prismaAny: any;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let perm: Permission;
  let now: Date;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    prismaAny = prisma as any;
    logger = mockDeep<LoggerPort>();
    repository = new PrismaPermissionRepository(prisma, logger);
    now = new Date();
    perm = new Permission('perm-1', 'READ', 'Read access', now, now);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a permission when found', async () => {
      prismaAny.permission.findUnique.mockResolvedValue({ id: 'perm-1', permissionKey: 'READ', description: 'Read access', createdAt: now, updatedAt: now } as any);

      const result = await repository.findById('perm-1');

      expect(result).toEqual(perm);
      expect(prismaAny.permission.findUnique).toHaveBeenCalledWith({ where: { id: 'perm-1' } });
    });

    it('should return null when not found', async () => {
      prismaAny.permission.findUnique.mockResolvedValue(null);

      const result = await repository.findById('unknown');

      expect(result).toBeNull();
      expect(prismaAny.permission.findUnique).toHaveBeenCalledWith({ where: { id: 'unknown' } });
    });
  });

  describe('findByKey', () => {
    it('should return a permission by key', async () => {
      prismaAny.permission.findFirst.mockResolvedValue({ id: 'perm-1', permissionKey: 'READ', description: 'Read access', createdAt: now, updatedAt: now } as any);

      const result = await repository.findByKey('READ');

      expect(result).toEqual(perm);
      expect(prismaAny.permission.findFirst).toHaveBeenCalledWith({ where: { permissionKey: 'READ' } });
    });

    it('should return null when permission not found', async () => {
      prismaAny.permission.findFirst.mockResolvedValue(null);

      const result = await repository.findByKey('WRITE');

      expect(result).toBeNull();
      expect(prismaAny.permission.findFirst).toHaveBeenCalledWith({ where: { permissionKey: 'WRITE' } });
    });
  });

  describe('create', () => {
    it('should create a permission', async () => {
      prismaAny.permission.create.mockResolvedValue({ id: 'perm-1', permissionKey: 'READ', description: 'Read access', createdAt: now, updatedAt: now } as any);

      const result = await repository.create(perm);

      expect(result).toEqual(perm);
      expect(prismaAny.permission.create).toHaveBeenCalledWith({
        data: {
          id: 'perm-1',
          permissionKey: 'READ',
          description: 'Read access',
          createdById: undefined,
          updatedById: undefined,
        },
      });
    });
  });

  describe('update', () => {
    it('should update a permission', async () => {
      prismaAny.permission.update.mockResolvedValue({ id: 'perm-1', permissionKey: 'WRITE', description: 'Write access', createdAt: now, updatedAt: now } as any);

      perm.permissionKey = 'WRITE';
      perm.description = 'Write access';
      const result = await repository.update(perm);

      expect(result).toEqual(new Permission('perm-1', 'WRITE', 'Write access', now, now));
      expect(prismaAny.permission.update).toHaveBeenCalledWith({
        where: { id: 'perm-1' },
        data: { permissionKey: 'WRITE', description: 'Write access', updatedById: undefined },
      });
    });
  });

  describe('delete', () => {
    it('should delete a permission', async () => {
      prismaAny.permission.delete.mockResolvedValue(undefined as any);

      await repository.delete('perm-1');

      expect(prismaAny.permission.delete).toHaveBeenCalledWith({ where: { id: 'perm-1' } });
    });
  });

  it('should paginate permissions', async () => {
    prismaAny.permission.findMany.mockResolvedValue([] as any);
    prismaAny.permission.count.mockResolvedValue(0 as any);
    const result = await repository.findPage({ page: 1, limit: 5 });
    expect(result).toEqual({ items: [], page: 1, limit: 5, total: 0 });
    expect(prismaAny.permission.findMany).toHaveBeenCalled();
    expect(prismaAny.permission.count).toHaveBeenCalled();
  });
  it('should return all permissions', async () => {
    prismaAny.permission.findMany.mockResolvedValue([
      {
        id: 'perm-1',
        permissionKey: 'READ',
        description: 'Read access',
        createdAt: now,
        updatedAt: now,
      },
    ] as any);
    const result = await repository.findAll();
    expect(result).toEqual([perm]);
    expect(prismaAny.permission.findMany).toHaveBeenCalledWith();
  });
});
