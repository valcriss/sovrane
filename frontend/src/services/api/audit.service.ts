import client from './client';
import type { components } from '@/types/api';

export type AuditEvent = components['schemas']['AuditEvent'];

export interface AuditListParams {
  page?: number;
  limit?: number;
  actorId?: string;
  action?: string;
  targetType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export default {
  async list(params: AuditListParams) {
    const res = await client.get<{ items: AuditEvent[]; page: number; limit: number; total: number }>('/audit', { params });
    return res.data;
  },
};
