import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthService from '@/services/api/auth.service';
import client from '@/services/api/client';

vi.mock('@/services/api/client', () => ({
  default: {
    post: vi.fn(),
  },
}));

const mocked = client as unknown as { post: ReturnType<typeof vi.fn> };

beforeEach(() => {
  mocked.post.mockReset();
});

describe('AuthService', () => {
  it('login posts credentials', async () => {
    mocked.post.mockResolvedValue({ data: { token: 't', refreshToken: 'r', user: { id: 'u' } } });
    const res = await AuthService.login({ email: 'a', password: 'b' });
    expect(mocked.post).toHaveBeenCalledWith('/auth/login', { email: 'a', password: 'b' });
    expect(res.token).toBe('t');
  });

  it('refresh posts token', async () => {
    mocked.post.mockResolvedValue({ data: { token: 'new', refreshToken: 'ref' } });
    const res = await AuthService.refresh({ refreshToken: 'r' });
    expect(mocked.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'r' });
    expect(res.token).toBe('new');
  });

  it('logout posts refresh token', async () => {
    mocked.post.mockResolvedValue({ data: {} });
    await AuthService.logout({ refreshToken: 'r' });
    expect(mocked.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'r' });
  });
});
