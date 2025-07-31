import client from './client';
import type { components } from '@/types/api';

export type AuditConfig = components['schemas']['AuditConfig'];
export type ConfigEntry = components['schemas']['ConfigEntry'];

export default {
  async getAuditConfig() {
    const res = await client.get<AuditConfig>('/audit/config');
    return res.data;
  },

  async updateAuditConfig(data: { levels: string[]; categories: string[]; updatedBy: string }) {
    const res = await client.put<AuditConfig>('/audit/config', data);
    return res.data;
  },

  async get(key: string) {
    const res = await client.get<ConfigEntry>(`/config/${key}`);
    return res.data;
  },

  async update(key: string, value: unknown, updatedBy: string) {
    await client.put(`/config/${key}`, { value, updatedBy });
  },

  async remove(key: string, deletedBy: string) {
    await client.delete(`/config/${key}`, { data: { deletedBy } });
  },
};
