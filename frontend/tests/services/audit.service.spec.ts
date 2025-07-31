import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuditService from '@/services/api/audit.service';
import client from '@/services/api/client';

vi.mock('@/services/api/client', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mocked = client as unknown as { get: ReturnType<typeof vi.fn> };

beforeEach(() => {
  mocked.get.mockReset();
});

describe('AuditService', () => {
  it('list calls GET /audit', async () => {
    mocked.get.mockResolvedValue({ data: { items: [], page: 1, limit: 20, total: 0 } });
    const res = await AuditService.list({ page: 1 });
    expect(mocked.get).toHaveBeenCalledWith('/audit', { params: { page: 1 } });
    expect(res.items).toEqual([]);
  });
});
