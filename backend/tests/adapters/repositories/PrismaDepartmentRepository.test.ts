import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaDepartmentRepository } from '../../../adapters/repositories/PrismaDepartmentRepository';
import { Department } from '../../../domain/entities/Department';
import { Site } from '../../../domain/entities/Site';
import { LoggerPort } from '../../../domain/ports/LoggerPort';

describe('PrismaDepartmentRepository', () => {
  let repo: PrismaDepartmentRepository;
  let prisma: DeepMockProxy<PrismaClient>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let dept: Department;
  let site: Site;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    logger = mockDeep<LoggerPort>();
    repo = new PrismaDepartmentRepository(prisma, logger);
    site = new Site('site-1', 'HQ');
    dept = new Department('dept-1', 'IT', null, 'user-1', site);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should find by id', async () => {
    prisma.department.findUnique.mockResolvedValue({
      id: 'dept-1',
      label: 'IT',
      parentDepartmentId: null,
      managerUserId: 'user-1',
      siteId: 'site-1',
      site: { id: 'site-1', label: 'HQ' }
    } as any);

    const result = await repo.findById('dept-1');
    dept.site.createdAt = result!.site.createdAt;
    dept.site.updatedAt = result!.site.updatedAt;
    dept.createdAt = result!.createdAt;
    dept.updatedAt = result!.updatedAt;
    expect(result).toEqual(dept);
    expect(prisma.department.findUnique).toHaveBeenCalledWith({ where: { id: 'dept-1' }, include: { site: true } });
  });

  it('should return null when department not found', async () => {
    prisma.department.findUnique.mockResolvedValue(null);

    const result = await repo.findById('unknown');

    expect(result).toBeNull();
    expect(prisma.department.findUnique).toHaveBeenCalledWith({ where: { id: 'unknown' }, include: { site: true } });
  });

  it('should create a department', async () => {
    prisma.department.create.mockResolvedValue({
      id: 'dept-1',
      label: 'IT',
      parentDepartmentId: null,
      managerUserId: 'user-1',
      siteId: 'site-1',
      site: { id: 'site-1', label: 'HQ' }
    } as any);

    const result = await repo.create(dept);
    dept.site.createdAt = result.site.createdAt;
    dept.site.updatedAt = result.site.updatedAt;
    dept.createdAt = result.createdAt;
    dept.updatedAt = result.updatedAt;
    expect(result).toEqual(dept);
    expect(prisma.department.create).toHaveBeenCalledWith({
      data: {
        id: 'dept-1',
        label: 'IT',
        parentDepartmentId: null,
        managerUserId: 'user-1',
        siteId: 'site-1',
        createdById: undefined,
        updatedById: undefined
      }
    , include: { site: true } });
  });

  it('should find by label', async () => {
    prisma.department.findFirst.mockResolvedValue({
      id: 'dept-1',
      label: 'IT',
      parentDepartmentId: null,
      managerUserId: 'user-1',
      siteId: 'site-1',
      site: { id: 'site-1', label: 'HQ' }
    } as any);

    const result = await repo.findByLabel('IT');
    if (result) {
      dept.site.createdAt = result.site.createdAt;
      dept.site.updatedAt = result.site.updatedAt;
      dept.createdAt = result.createdAt;
      dept.updatedAt = result.updatedAt;
    }
    expect(result).toEqual(dept);
    expect(prisma.department.findFirst).toHaveBeenCalledWith({ where: { label: 'IT' }, include: { site: true } });
  });

  it('should return null when department not found by label', async () => {
    prisma.department.findFirst.mockResolvedValue(null);

    const result = await repo.findByLabel('Unknown');

    expect(result).toBeNull();
    expect(prisma.department.findFirst).toHaveBeenCalledWith({ where: { label: 'Unknown' }, include: { site: true } });
  });

  it('should update a department', async () => {
    const updated = new Department('dept-1', 'Tech', null, 'user-2', site);
    prisma.department.update.mockResolvedValue({
      id: 'dept-1',
      label: 'Tech',
      parentDepartmentId: null,
      managerUserId: 'user-2',
      siteId: 'site-1',
      site: { id: 'site-1', label: 'HQ' }
    } as any);

    const result = await repo.update(updated);
    updated.site.createdAt = result.site.createdAt;
    updated.site.updatedAt = result.site.updatedAt;
    updated.createdAt = result.createdAt;
    updated.updatedAt = result.updatedAt;
    expect(result).toEqual(updated);
    expect(prisma.department.update).toHaveBeenCalledWith({
      where: { id: 'dept-1' },
      data: {
        label: 'Tech',
        parentDepartmentId: null,
        managerUserId: 'user-2',
        siteId: 'site-1',
        updatedById: undefined
      },
      include: { site: true }
    });
  });

  it('should find departments by site id', async () => {
    prisma.department.findMany.mockResolvedValue([
      {
        id: 'dept-1',
        label: 'IT',
        parentDepartmentId: null,
        managerUserId: 'user-1',
        siteId: 'site-1',
        site: { id: 'site-1', label: 'HQ' }
      }
    ] as any);

    const result = await repo.findBySiteId('site-1');
    dept.site.createdAt = result[0].site.createdAt;
    dept.site.updatedAt = result[0].site.updatedAt;
    dept.createdAt = result[0].createdAt;
    dept.updatedAt = result[0].updatedAt;
    expect(result).toEqual([dept]);
    expect(prisma.department.findMany).toHaveBeenCalledWith({ where: { siteId: 'site-1' }, include: { site: true } });
  });

  it('should delete a department', async () => {
    prisma.department.delete.mockResolvedValue(undefined as any);

    await repo.delete('dept-1');

    expect(prisma.department.delete).toHaveBeenCalledWith({ where: { id: 'dept-1' } });
  });

  it('should paginate departments', async () => {
    prisma.department.findMany.mockResolvedValue([] as any);
    prisma.department.count.mockResolvedValue(0 as any);
    const result = await repo.findPage({ page: 1, limit: 10 });
    expect(result).toEqual({ items: [], page: 1, limit: 10, total: 0 });
    expect(prisma.department.findMany).toHaveBeenCalled();
    expect(prisma.department.count).toHaveBeenCalled();
  });

  it('should return all departments', async () => {
    prisma.department.findMany.mockResolvedValue([
      {
        id: 'dept-1',
        label: 'IT',
        parentDepartmentId: null,
        managerUserId: 'user-1',
        siteId: 'site-1',
        site: { id: 'site-1', label: 'HQ' },
      } as any,
    ]);

    const result = await repo.findAll();
    dept.site.createdAt = result[0].site.createdAt;
    dept.site.updatedAt = result[0].site.updatedAt;
    dept.createdAt = result[0].createdAt;
    dept.updatedAt = result[0].updatedAt;
    expect(result).toEqual([dept]);
    expect(prisma.department.findMany).toHaveBeenCalledWith({ include: { site: true } });
  });
});
