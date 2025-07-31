import { describe, it, expect, vi, beforeEach } from 'vitest';
import UsersService from '@/services/api/users.service';
import client from '@/services/api/client';

vi.mock('@/services/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mocked = client as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  mocked.get.mockReset();
  mocked.post.mockReset();
  mocked.put.mockReset();
  mocked.delete.mockReset();
});

describe('UsersService', () => {
  it('list calls GET /users', async () => {
    mocked.get.mockResolvedValue({ data: { items: [], page: 1, limit: 20, total: 0 } });
    const res = await UsersService.list({ page: 1 });
    expect(mocked.get).toHaveBeenCalledWith('/users', { params: { page: 1 } });
    expect(res.items).toEqual([]);
  });

  it('get calls GET /users/{id}', async () => {
    mocked.get.mockResolvedValue({ data: { id: '1' } });
    const res = await UsersService.get('1');
    expect(mocked.get).toHaveBeenCalledWith('/users/1');
    expect(res.id).toBe('1');
  });

  it('create posts /users', async () => {
    mocked.post.mockResolvedValue({ data: { user: { id: '1' }, token: 't', refreshToken: 'r' } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {};
    const res = await UsersService.create(payload);
    expect(mocked.post).toHaveBeenCalledWith('/users', payload);
    expect(res.token).toBe('t');
  });

  it('update puts /users/{id}', async () => {
    mocked.put.mockResolvedValue({ data: { id: '1' } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = {};
    const res = await UsersService.update('1', update);
    expect(mocked.put).toHaveBeenCalledWith('/users/1', update);
    expect(res.id).toBe('1');
  });

  it('remove deletes /users/{id}', async () => {
    mocked.delete.mockResolvedValue({});
    await UsersService.remove('1');
    expect(mocked.delete).toHaveBeenCalledWith('/users/1');
  });
});
