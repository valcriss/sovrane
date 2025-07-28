import { AppConfig } from '../entities/AppConfig';

/**
 * Provides access to persisted application configuration values.
 */
export interface ConfigPort {
  /**
   * Retrieve a configuration entry by key.
   *
   * @param key - Unique configuration key.
   * @returns Matching {@link AppConfig} or `null` if none exists.
   */
  findByKey(key: string): Promise<AppConfig | null>;

  /**
   * Create or update a configuration entry.
   *
   * @param key - Configuration key.
   * @param value - Value to store as string.
   * @param type - Value type.
   * @param updatedBy - User responsible for the change.
   * @returns Persisted configuration.
   */
  upsert(key: string, value: string, type: string, updatedBy: string): Promise<AppConfig>;
}
