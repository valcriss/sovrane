import { AuditConfigService } from '../../domain/services/AuditConfigService';
import { AuditConfig } from '../../domain/entities/AuditConfig';

/**
 * Retrieve the audit configuration using the configured service.
 */
export class GetAuditConfigUseCase {
  constructor(private readonly service: AuditConfigService) {}

  /**
   * Execute the retrieval.
   *
   * @returns The current {@link AuditConfig} or `null` if none exists.
   */
  async execute(): Promise<AuditConfig | null> {
    return this.service.get();
  }
}
