import { AuditConfigPort } from '../../../domain/ports/AuditConfigPort';
import { AuditConfig } from '../../../domain/entities/AuditConfig';

class InMemoryAuditConfigRepo implements AuditConfigPort {
  private config: AuditConfig | null = null;
  async get(): Promise<AuditConfig | null> {
    return this.config;
  }
  async update(levels: string[], categories: string[], updatedBy: string): Promise<AuditConfig> {
    const cfg = new AuditConfig(1, levels, categories, new Date(), updatedBy);
    this.config = cfg;
    return cfg;
  }
}

describe('AuditConfigPort Interface', () => {
  let repo: InMemoryAuditConfigRepo;

  beforeEach(() => {
    repo = new InMemoryAuditConfigRepo();
  });

  it('should return null when no config is stored', async () => {
    expect(await repo.get()).toBeNull();
  });

  it('should store and return configuration', async () => {
    const cfg = await repo.update(['warn'], ['security'], 'tester');
    const stored = await repo.get();
    expect(stored).toEqual(cfg);
    expect(stored?.levels).toEqual(['warn']);
    expect(stored?.categories).toEqual(['security']);
    expect(stored?.updatedBy).toBe('tester');
  });
});
