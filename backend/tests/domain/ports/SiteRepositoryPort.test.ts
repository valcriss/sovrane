import { SiteRepositoryPort } from '../../../domain/ports/SiteRepositoryPort';
import { Site } from '../../../domain/entities/Site';

class MockSiteRepository implements SiteRepositoryPort {
  private sites: Map<string, Site> = new Map();
  private labelIndex: Map<string, string> = new Map();

  async findById(id: string): Promise<Site | null> {
    return this.sites.get(id) || null;
  }

  async findByLabel(label: string): Promise<Site | null> {
    const id = this.labelIndex.get(label);
    return id ? this.sites.get(id) || null : null;
  }

  async findAll(): Promise<Site[]> {
    return Array.from(this.sites.values());
  }

  async findPage(params: { page: number; limit: number }): Promise<{ items: Site[]; page: number; limit: number; total: number }> {
    const items = Array.from(this.sites.values()).slice((params.page - 1) * params.limit, params.page * params.limit);
    return { items, page: params.page, limit: params.limit, total: this.sites.size };
  }

  async create(site: Site): Promise<Site> {
    this.sites.set(site.id, site);
    this.labelIndex.set(site.label, site.id);
    return site;
  }

  async update(site: Site): Promise<Site> {
    if (!this.sites.has(site.id)) {
      throw new Error('Site not found');
    }
    const existing = this.sites.get(site.id);
    if (existing) this.labelIndex.delete(existing.label);
    this.sites.set(site.id, site);
    this.labelIndex.set(site.label, site.id);
    return site;
  }

  async delete(id: string): Promise<void> {
    const site = this.sites.get(id);
    if (site) {
      this.sites.delete(id);
      this.labelIndex.delete(site.label);
    }
  }

  clear(): void {
    this.sites.clear();
    this.labelIndex.clear();
  }
}

describe('SiteRepositoryPort Interface', () => {
  let repo: MockSiteRepository;
  let site: Site;

  beforeEach(() => {
    repo = new MockSiteRepository();
    site = new Site('site-1', 'HQ');
  });

  afterEach(() => {
    repo.clear();
  });

  it('should create and retrieve a site', async () => {
    await repo.create(site);
    expect(await repo.findById('site-1')).toEqual(site);
    expect(await repo.findByLabel('HQ')).toEqual(site);
    expect(await repo.findAll()).toEqual([site]);
  });

  it('should update an existing site', async () => {
    await repo.create(site);
    site.label = 'Lyon';
    const updated = await repo.update(site);
    expect(updated.label).toBe('Lyon');
    expect(await repo.findByLabel('Lyon')).toEqual(site);
  });

  it('should delete a site', async () => {
    await repo.create(site);
    await repo.delete('site-1');
    expect(await repo.findById('site-1')).toBeNull();
  });

  it('should list all sites', async () => {
    await repo.create(site);
    const other = new Site('s2', 'Branch');
    await repo.create(other);
    expect(await repo.findAll()).toEqual([site, other]);
  });
});
