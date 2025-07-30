/**
 * Represents the audit logging configuration stored in the system.
 */
export class AuditConfig {
  /**
   * Create a new configuration instance.
   *
   * @param id - Numeric identifier of the persisted configuration row.
   * @param levels - Collection of enabled audit levels (e.g. 'info', 'error').
   * @param categories - Audit event categories to record.
   * @param updatedAt - Date when the configuration was last modified.
   * @param updatedBy - Identifier of the user who performed the last update.
   */
  constructor(
    public readonly id: number,
    public levels: string[],
    public categories: string[],
    public updatedAt: Date | null,
    public updatedBy: string | null,
  ) {}
}
