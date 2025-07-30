import { AuditConfig } from '../../../domain/entities/AuditConfig';

describe('AuditConfig Entity', () => {
  it('should store provided values', () => {
    const cfg = new AuditConfig(1, ['info'], ['auth'], new Date('2024-01-01T00:00:00Z'), 'user');
    expect(cfg.id).toBe(1);
    expect(cfg.levels).toEqual(['info']);
    expect(cfg.categories).toEqual(['auth']);
    expect(cfg.updatedAt?.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    expect(cfg.updatedBy).toBe('user');
  });
});
