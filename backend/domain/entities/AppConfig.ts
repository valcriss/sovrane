/**
 * Represents a persistent application configuration entry.
 */
export class AppConfig {
  /**
   * Create a configuration item.
   *
   * @param id - Numeric identifier.
   * @param key - Configuration key.
   * @param value - Raw value stored as string.
   * @param type - Value type: 'string', 'number', 'boolean', or 'json'.
   * @param updatedAt - Date when the item was last updated.
   * @param updatedBy - Identifier of the user that performed the update.
   */
  constructor(
    public readonly id: number,
    public key: string,
    public value: string,
    public type: 'string' | 'number' | 'boolean' | 'json',
    public updatedAt: Date,
    public updatedBy: string,
  ) {}
}
