import { ConfigService } from '../../domain/services/ConfigService';

/**
 * Update a configuration value after validating it.
 */
export class UpdateConfigUseCase {
  constructor(private readonly service: ConfigService) {}

  /**
   * Validate and persist a configuration value.
   *
   * @param key - Configuration key to update.
   * @param value - New value for the key.
   * @param updatedBy - User performing the change.
   */
  async execute(key: string, value: unknown, updatedBy: string): Promise<void> {
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
  }
}
