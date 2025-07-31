import client from './client';
import type { components } from '@/types/api';

export type LoginRequest = { email: string; password: string };
export type LoginResponse = { user: components['schemas']['User']; token: string; refreshToken: string };
export type RefreshRequest = { refreshToken: string };
export type RefreshResponse = { token: string; refreshToken: string };
export type LogoutRequest = { refreshToken: string };
export type MfaVerifyRequest = { userId: string; code: string };

export default {
  async login(data: LoginRequest) {
    const res = await client.post<LoginResponse>('/auth/login', data);
    return res.data;
  },

  async refresh(data: RefreshRequest) {
    const res = await client.post<RefreshResponse>('/auth/refresh', data);
    return res.data;
  },

  async logout(data: LogoutRequest) {
    const res = await client.post('/auth/logout', data);
    return res.data;
  },

  async verifyMfa(data: MfaVerifyRequest) {
    const res = await client.post<LoginResponse>('/auth/mfa/verify', data);
    return res.data;
  },
};
