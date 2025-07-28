import { ConfigService } from '../../domain/services/ConfigService';

/**
 * Retrieve a configuration value by key.
 */
export class GetConfigUseCase {
  constructor(private readonly service: ConfigService) {}

  /**
   * Execute the use case.
   *
   * @param key - Key of the configuration entry.
   * @returns The parsed configuration value or `null` if absent.
   */
  async execute<T>(key: string): Promise<T | null> {
    return this.service.get<T>(key);
  }
}
