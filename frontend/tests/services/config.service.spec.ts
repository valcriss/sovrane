import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConfigService from '@/services/api/config.service';
import client from '@/services/api/client';

vi.mock('@/services/api/client', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mocked = client as unknown as {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  mocked.get.mockReset();
  mocked.put.mockReset();
  mocked.delete.mockReset();
});

describe('ConfigService', () => {
  it('getAuditConfig calls GET /audit/config', async () => {
    mocked.get.mockResolvedValue({ data: { levels: [] } });
    const res = await ConfigService.getAuditConfig();
    expect(mocked.get).toHaveBeenCalledWith('/audit/config');
    expect(res.levels).toEqual([]);
  });

  it('updateAuditConfig calls PUT /audit/config', async () => {
    mocked.put.mockResolvedValue({ data: { levels: ['info'] } });
    const res = await ConfigService.updateAuditConfig({ levels: ['info'], categories: [], updatedBy: 'u' });
    expect(mocked.put).toHaveBeenCalledWith('/audit/config', { levels: ['info'], categories: [], updatedBy: 'u' });
    expect(res.levels).toEqual(['info']);
  });

  it('get config calls GET /config/key', async () => {
    mocked.get.mockResolvedValue({ data: { key: 'a', value: 'b' } });
    const res = await ConfigService.get('a');
    expect(mocked.get).toHaveBeenCalledWith('/config/a');
    expect(res.key).toBe('a');
  });

  it('update config calls PUT /config/key', async () => {
    mocked.put.mockResolvedValue({});
    await ConfigService.update('a', 'v', 'me');
    expect(mocked.put).toHaveBeenCalledWith('/config/a', { value: 'v', updatedBy: 'me' });
  });

  it('remove config calls DELETE /config/key', async () => {
    mocked.delete.mockResolvedValue({});
    await ConfigService.remove('a', 'me');
    expect(mocked.delete).toHaveBeenCalledWith('/config/a', { data: { deletedBy: 'me' } });
  });
});
