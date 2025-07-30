import { AuditConfigService } from '../../domain/services/AuditConfigService';
import { AuditConfig } from '../../domain/entities/AuditConfig';
import { AuditPort } from '../../domain/ports/AuditPort';
import { AuditEvent } from '../../domain/entities/AuditEvent';
import { AuditEventType } from '../../domain/entities/AuditEventType';

/**
 * Persist audit configuration changes and log the update.
 */
export class UpdateAuditConfigUseCase {
  constructor(
    private readonly service: AuditConfigService,
    private readonly audit: AuditPort,
  ) {}

  /**
   * Update the configuration and record the change.
   *
   * @param levels - Enabled audit levels.
   * @param categories - Event categories to record.
   * @param updatedBy - Identifier of the user applying the update.
   * @returns The updated {@link AuditConfig} instance.
   */
  async execute(
    levels: string[],
    categories: string[],
    updatedBy: string,
  ): Promise<AuditConfig> {
    const cfg = await this.service.update(levels, categories, updatedBy);
    await this.audit.log(
      new AuditEvent(
        new Date(),
        updatedBy,
        'user',
        AuditEventType.AUDIT_CONFIG_UPDATED,
        'audit-config',
      ),
    );
    return cfg;
  }
}
