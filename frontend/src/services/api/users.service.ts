import client from './client';
import type { components } from '@/types/api';

export type User = components['schemas']['User'];

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'suspended' | 'archived';
  departmentId?: string;
  siteId?: string;
  roleId?: string;
}

export default {
  async me() {
    const res = await client.get<User>('/users/me');
    return res.data;
  },
  async list(params: ListUsersParams) {
    const res = await client.get<{ items: User[]; page: number; limit: number; total: number }>('/users', { params });
    return res.data;
  },

  async get(id: string) {
    const res = await client.get<User>(`/users/${id}`);
    return res.data;
  },

  async create(data: User & { password: string }) {
    const res = await client.post<{ user: User; token: string; refreshToken: string }>('/users', data);
    return res.data;
  },

  async update(id: string, data: User) {
    const res = await client.put<User>(`/users/${id}`, data);
    return res.data;
  },

  async remove(id: string) {
    await client.delete(`/users/${id}`);
  },
};
