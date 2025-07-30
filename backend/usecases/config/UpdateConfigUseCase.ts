import { ConfigService } from '../../domain/services/ConfigService';
import { AuditPort } from '../../domain/ports/AuditPort';
import { AuditEvent } from '../../domain/entities/AuditEvent';
import { AuditEventType } from '../../domain/entities/AuditEventType';

/**
 * Update a configuration value after validating it.
 */
export class UpdateConfigUseCase {
  constructor(
    private readonly service: ConfigService,
    private readonly audit: AuditPort,
  ) {}

  /**
   * Validate and persist a configuration value.
   *
   * @param key - Configuration key to update.
   * @param value - New value for the key.
   * @param updatedBy - User performing the change.
   */
  async execute(key: string, value: unknown, updatedBy: string): Promise<void> {
    const oldValue = await this.service.get<unknown>(key);

    if (key === 'passwordMinLength') {
      if (typeof value !== 'number' || value < 8) {
        throw new Error('passwordMinLength must be >= 8');
      }
    }
    if (key === 'maxAttempts') {
      if (typeof value !== 'number' || value < 1 || value > 10) {
        throw new Error('maxAttempts must be between 1 and 10');
      }
    }

    await this.service.update(key, value, updatedBy);

    const action =
      oldValue === null
        ? AuditEventType.CONFIG_CREATED
        : AuditEventType.CONFIG_UPDATED;
    await this.audit.log(
      new AuditEvent(new Date(), updatedBy, 'user', action, 'config', key, {
        key,
        oldValue,
        newValue: value,
      }),
    );
  }
}
