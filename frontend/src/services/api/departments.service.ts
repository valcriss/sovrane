import client from './client';
import type { components } from '@/types/api';

export type Department = components['schemas']['Department'];

export interface ListDepartmentsParams {
  page?: number;
  limit?: number;
  search?: string;
  siteId?: string;
}

export default {
  async list(params: ListDepartmentsParams = {}) {
    const res = await client.get<{ items: Department[]; page: number; limit: number; total: number }>('/departments', { params });
    return res.data;
  },

  async get(id: string) {
    const res = await client.get<Department>(`/departments/${id}`);
    return res.data;
  },

  async create(data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) {
    const res = await client.post<Department>('/departments', data);
    return res.data;
  },

  async update(id: string, data: Partial<Omit<Department, 'id' | 'createdAt' | 'updatedAt'>>) {
    const res = await client.put<Department>(`/departments/${id}`, data);
    return res.data;
  },

  async remove(id: string) {
    await client.delete(`/departments/${id}`);
  },
};
