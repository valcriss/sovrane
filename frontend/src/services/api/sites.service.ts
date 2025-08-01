import client from './client';
import type { components } from '@/types/api';

export type Site = components['schemas']['Site'];

export interface ListSitesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export default {
  async list(params: ListSitesParams = {}) {
    const res = await client.get<{ items: Site[]; page: number; limit: number; total: number }>('/sites', { params });
    return res.data;
  },

  async get(id: string) {
    const res = await client.get<Site>(`/sites/${id}`);
    return res.data;
  },

  async create(data: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>) {
    const res = await client.post<Site>('/sites', data);
    return res.data;
  },

  async update(id: string, data: Partial<Omit<Site, 'id' | 'createdAt' | 'updatedAt'>>) {
    const res = await client.put<Site>(`/sites/${id}`, data);
    return res.data;
  },

  async remove(id: string) {
    await client.delete(`/sites/${id}`);
  },
};
