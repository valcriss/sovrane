import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaSiteRepository } from '../../../adapters/repositories/PrismaSiteRepository';
import { Site } from '../../../domain/entities/Site';
import { LoggerPort } from '../../../domain/ports/LoggerPort';

describe('PrismaSiteRepository', () => {
  let repo: PrismaSiteRepository;
  let prisma: DeepMockProxy<PrismaClient>;
  let logger: ReturnType<typeof mockDeep<LoggerPort>>;
  let site: Site;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    logger = mockDeep<LoggerPort>();
    repo = new PrismaSiteRepository(prisma, logger);
    site = new Site('site-1', 'HQ');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should find by id', async () => {
    prisma.site.findUnique.mockResolvedValue({
      id: 'site-1',
      label: 'HQ',
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
    } as any);
    const result = await repo.findById('site-1');
    expect(result).toEqual(site);
    expect(prisma.site.findUnique).toHaveBeenCalledWith({ where: { id: 'site-1' } });
  });

  it('should return null when site not found by id', async () => {
    prisma.site.findUnique.mockResolvedValue(null);

    const result = await repo.findById('missing');

    expect(result).toBeNull();
    expect(prisma.site.findUnique).toHaveBeenCalledWith({ where: { id: 'missing' } });
  });

  it('should create a site', async () => {
    prisma.site.create.mockResolvedValue({
      id: 'site-1',
      label: 'HQ',
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
    } as any);
    const result = await repo.create(site);
    expect(result).toEqual(site);
    expect(prisma.site.create).toHaveBeenCalledWith({
      data: { id: 'site-1', label: 'HQ', createdById: undefined, updatedById: undefined },
    });
  });

  it('should find by label', async () => {
    prisma.site.findFirst.mockResolvedValue({
      id: 'site-1',
      label: 'HQ',
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
    } as any);
    const result = await repo.findByLabel('HQ');
    expect(result).toEqual(site);
    expect(prisma.site.findFirst).toHaveBeenCalledWith({ where: { label: 'HQ' } });
  });

  it('should return null when site not found by label', async () => {
    prisma.site.findFirst.mockResolvedValue(null);

    const result = await repo.findByLabel('missing');

    expect(result).toBeNull();
    expect(prisma.site.findFirst).toHaveBeenCalledWith({ where: { label: 'missing' } });
  });

  it('should update a site', async () => {
    prisma.site.update.mockResolvedValue({
      id: 'site-1',
      label: 'Paris',
      createdAt: site.createdAt,
      updatedAt: new Date('2024-01-01'),
    } as any);
    const updated = new Site('site-1', 'Paris');
    updated.createdAt = site.createdAt;
    updated.updatedAt = new Date('2024-01-01');
    const result = await repo.update(updated);
    expect(result).toEqual(updated);
    expect(prisma.site.update).toHaveBeenCalledWith({ where: { id: 'site-1' }, data: { label: 'Paris', updatedById: undefined } });
  });

  it('should delete a site', async () => {
    prisma.site.delete.mockResolvedValue(undefined as any);
    await repo.delete('site-1');
    expect(prisma.site.delete).toHaveBeenCalledWith({ where: { id: 'site-1' } });
  });

  it('should paginate sites', async () => {
    prisma.site.findMany.mockResolvedValue([] as any);
    prisma.site.count.mockResolvedValue(0 as any);
    const result = await repo.findPage({ page: 1, limit: 5 });
    expect(result).toEqual({ items: [], page: 1, limit: 5, total: 0 });
    expect(prisma.site.findMany).toHaveBeenCalled();
    expect(prisma.site.count).toHaveBeenCalled();
  });

  it('should return all sites', async () => {
    prisma.site.findMany.mockResolvedValue([
      {
        id: 'site-1',
        label: 'HQ',
        createdAt: site.createdAt,
        updatedAt: site.updatedAt,
      } as any,
    ]);
    const result = await repo.findAll();
    expect(result).toEqual([site]);
    expect(prisma.site.findMany).toHaveBeenCalledWith();
  });
});
