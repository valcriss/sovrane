import { ConfigService } from '../../domain/services/ConfigService';
import { AuditPort } from '../../domain/ports/AuditPort';
import { AuditEvent } from '../../domain/entities/AuditEvent';
import { AuditEventType } from '../../domain/entities/AuditEventType';

/**
 * Use case for deleting a configuration entry.
 */
export class DeleteConfigUseCase {
  constructor(
    private readonly service: ConfigService,
    private readonly audit: AuditPort,
  ) {}

  /**
   * Delete a configuration entry and log the action.
   *
   * @param key - Key of the configuration item to remove.
   * @param deletedBy - Identifier of the user performing the deletion.
   */
  async execute(key: string, deletedBy: string): Promise<void> {
    const oldValue = await this.service.get<unknown>(key);
    const record = await this.service.delete(key);
    if (!record) {
      return;
    }
    await this.audit.log(
      new AuditEvent(new Date(), deletedBy, 'user', AuditEventType.CONFIG_DELETED, 'config', key, {
        key,
        oldValue,
        newValue: null,
      }),
    );
  }
}
