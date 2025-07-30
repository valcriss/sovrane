import { AuditConfig } from '../entities/AuditConfig';

/**
 * Provides access to the single audit configuration entry.
 */
export interface AuditConfigPort {
  /**
   * Retrieve the stored audit configuration.
   *
   * @returns The {@link AuditConfig} instance or `null` if none exists.
   */
  get(): Promise<AuditConfig | null>;

  /**
   * Update the audit configuration.
   *
   * @param levels - Enabled audit levels to persist.
   * @param categories - Categories of events to record.
   * @param updatedBy - Identifier of the user performing the update.
   * @returns The persisted {@link AuditConfig} after update.
   */
  update(levels: string[], categories: string[], updatedBy: string): Promise<AuditConfig>;
}
