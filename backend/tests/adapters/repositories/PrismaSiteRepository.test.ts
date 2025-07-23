import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaSiteRepository } from '../../../adapters/repositories/PrismaSiteRepository';
import { Site } from '../../../domain/entities/Site';

describe('PrismaSiteRepository', () => {
  let repo: PrismaSiteRepository;
  let prisma: DeepMockProxy<PrismaClient>;
  let site: Site;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    repo = new PrismaSiteRepository(prisma);
    site = new Site('site-1', 'HQ');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should find by id', async () => {
    prisma.site.findUnique.mockResolvedValue({ id: 'site-1', label: 'HQ' } as any);
    const result = await repo.findById('site-1');
    expect(result).toEqual(site);
    expect(prisma.site.findUnique).toHaveBeenCalledWith({ where: { id: 'site-1' } });
  });

  it('should create a site', async () => {
    prisma.site.create.mockResolvedValue({ id: 'site-1', label: 'HQ' } as any);
    const result = await repo.create(site);
    expect(result).toEqual(site);
    expect(prisma.site.create).toHaveBeenCalledWith({ data: { id: 'site-1', label: 'HQ' } });
  });

  it('should find by label', async () => {
    prisma.site.findFirst.mockResolvedValue({ id: 'site-1', label: 'HQ' } as any);
    const result = await repo.findByLabel('HQ');
    expect(result).toEqual(site);
    expect(prisma.site.findFirst).toHaveBeenCalledWith({ where: { label: 'HQ' } });
  });

  it('should update a site', async () => {
    prisma.site.update.mockResolvedValue({ id: 'site-1', label: 'Paris' } as any);
    const updated = new Site('site-1', 'Paris');
    const result = await repo.update(updated);
    expect(result).toEqual(updated);
    expect(prisma.site.update).toHaveBeenCalledWith({ where: { id: 'site-1' }, data: { label: 'Paris' } });
  });

  it('should delete a site', async () => {
    prisma.site.delete.mockResolvedValue(undefined as any);
    await repo.delete('site-1');
    expect(prisma.site.delete).toHaveBeenCalledWith({ where: { id: 'site-1' } });
  });
});
